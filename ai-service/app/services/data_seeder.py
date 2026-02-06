"""Data seeder service for initializing vector database with seed data."""

import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

from app.models.schemas import LogDocument
from app.data.log_templates import LOG_TEMPLATES, find_matching_categories

logger = logging.getLogger(__name__)


class SeedingStatus(str, Enum):
    """Status of seeding operation."""

    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class SeedingResult:
    """Result of a seeding operation."""

    status: SeedingStatus
    total_entries: int = 0
    seeded_entries: int = 0
    failed_entries: int = 0
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    categories_seeded: List[str] = field(default_factory=list)


class DataSeederService:
    """Service for seeding vector database with initial log data."""

    DEFAULT_SEED_FILE = "app/data/seed_logs_expanded.json"

    def __init__(self, embedding_service: Any = None):
        """Initialize data seeder service.

        Args:
            embedding_service: Optional embedding service for vector operations.
        """
        self.embedding_service = embedding_service
        self._seeding_status = SeedingStatus.NOT_STARTED
        self._last_result: Optional[SeedingResult] = None

    def seed_from_file(self, file_path: Optional[str] = None) -> SeedingResult:
        """Seed vector database from a JSON file.

        Args:
            file_path: Path to JSON file with log entries.
                      Defaults to seed_logs_expanded.json.

        Returns:
            SeedingResult with operation status.
        """
        if file_path is None:
            file_path = self.DEFAULT_SEED_FILE

        self._seeding_status = SeedingStatus.IN_PROGRESS
        result = SeedingResult(
            status=SeedingStatus.IN_PROGRESS,
            started_at=datetime.now().isoformat(),
        )

        try:
            # Load JSON file
            path = Path(file_path)
            if not path.exists():
                # Try relative to app directory
                base_path = Path(__file__).parent.parent.parent
                path = base_path / file_path
                if not path.exists():
                    raise FileNotFoundError(f"Seed file not found: {file_path}")

            with open(path, "r", encoding="utf-8") as f:
                log_entries = json.load(f)

            result.total_entries = len(log_entries)

            # Convert to LogDocument objects
            log_documents = self._convert_to_log_documents(log_entries)
            result.seeded_entries = len(log_documents)
            result.failed_entries = result.total_entries - len(log_documents)

            # Get unique categories
            categories = set()
            for entry in log_entries:
                if "category" in entry:
                    categories.add(entry["category"])
            result.categories_seeded = list(categories)

            # If embedding service is available, add to vector store
            if self.embedding_service:
                self.embedding_service.add_logs(log_documents)
                logger.info(
                    f"Seeded {len(log_documents)} logs to vector store"
                )

            result.status = SeedingStatus.COMPLETED
            result.completed_at = datetime.now().isoformat()
            self._seeding_status = SeedingStatus.COMPLETED

        except Exception as e:
            logger.error(f"Seeding from file failed: {e}")
            result.status = SeedingStatus.FAILED
            result.error_message = str(e)
            result.completed_at = datetime.now().isoformat()
            self._seeding_status = SeedingStatus.FAILED

        self._last_result = result
        return result

    def seed_from_templates(self, count_per_category: int = 10) -> SeedingResult:
        """Generate and seed synthetic log entries from templates.

        Args:
            count_per_category: Number of entries to generate per category.

        Returns:
            SeedingResult with operation status.
        """
        self._seeding_status = SeedingStatus.IN_PROGRESS
        result = SeedingResult(
            status=SeedingStatus.IN_PROGRESS,
            started_at=datetime.now().isoformat(),
        )

        try:
            log_entries = []
            categories_seeded = []

            for category, template in LOG_TEMPLATES.items():
                category_logs = self._generate_logs_from_template(
                    category, template, count_per_category
                )
                log_entries.extend(category_logs)
                categories_seeded.append(category)

            result.total_entries = len(log_entries)

            # Convert to LogDocument objects
            log_documents = self._convert_to_log_documents(log_entries)
            result.seeded_entries = len(log_documents)
            result.failed_entries = result.total_entries - len(log_documents)
            result.categories_seeded = categories_seeded

            # If embedding service is available, add to vector store
            if self.embedding_service:
                self.embedding_service.add_logs(log_documents)
                logger.info(
                    f"Seeded {len(log_documents)} template-based logs to vector store"
                )

            result.status = SeedingStatus.COMPLETED
            result.completed_at = datetime.now().isoformat()
            self._seeding_status = SeedingStatus.COMPLETED

        except Exception as e:
            logger.error(f"Seeding from templates failed: {e}")
            result.status = SeedingStatus.FAILED
            result.error_message = str(e)
            result.completed_at = datetime.now().isoformat()
            self._seeding_status = SeedingStatus.FAILED

        self._last_result = result
        return result

    def seed_from_voc_resolution(
        self,
        voc_id: str,
        title: str,
        content: str,
        resolution: str,
        analysis_result: Dict[str, Any],
    ) -> SeedingResult:
        """Seed vector database with resolved VOC data for progressive learning.

        Args:
            voc_id: VOC identifier.
            title: VOC title.
            content: VOC content.
            resolution: How the VOC was resolved.
            analysis_result: AI analysis result for this VOC.

        Returns:
            SeedingResult with operation status.
        """
        self._seeding_status = SeedingStatus.IN_PROGRESS
        result = SeedingResult(
            status=SeedingStatus.IN_PROGRESS,
            started_at=datetime.now().isoformat(),
            total_entries=1,
        )

        try:
            # Create a log-like entry from the VOC resolution
            log_entry = {
                "id": f"voc-{voc_id}",
                "timestamp": datetime.now().isoformat(),
                "logLevel": "INFO",
                "serviceName": "voc-service",
                "message": f"[Resolved VOC] {title}: {content}. Resolution: {resolution}",
                "category": self._detect_category_from_content(title, content),
                "severity": "medium",
                "resolution": resolution,
                "analysis": analysis_result,
            }

            log_documents = self._convert_to_log_documents([log_entry])

            if log_documents and self.embedding_service:
                self.embedding_service.add_logs(log_documents)
                result.seeded_entries = 1
                logger.info(f"Seeded VOC {voc_id} resolution to vector store")
            else:
                result.failed_entries = 1

            categories = find_matching_categories(f"{title} {content}")
            if categories:
                result.categories_seeded = [categories[0][0]]

            result.status = SeedingStatus.COMPLETED
            result.completed_at = datetime.now().isoformat()
            self._seeding_status = SeedingStatus.COMPLETED

        except Exception as e:
            logger.error(f"Seeding VOC resolution failed: {e}")
            result.status = SeedingStatus.FAILED
            result.error_message = str(e)
            result.completed_at = datetime.now().isoformat()
            self._seeding_status = SeedingStatus.FAILED

        self._last_result = result
        return result

    def get_seeding_status(self) -> Dict[str, Any]:
        """Get current seeding status and last result.

        Returns:
            Dict with status and last result information.
        """
        response = {
            "current_status": self._seeding_status.value,
            "last_result": None,
        }

        if self._last_result:
            response["last_result"] = {
                "status": self._last_result.status.value,
                "total_entries": self._last_result.total_entries,
                "seeded_entries": self._last_result.seeded_entries,
                "failed_entries": self._last_result.failed_entries,
                "started_at": self._last_result.started_at,
                "completed_at": self._last_result.completed_at,
                "error_message": self._last_result.error_message,
                "categories_seeded": self._last_result.categories_seeded,
            }

        return response

    def _convert_to_log_documents(
        self, entries: List[Dict[str, Any]]
    ) -> List[LogDocument]:
        """Convert raw entries to LogDocument objects.

        Args:
            entries: List of raw log entries.

        Returns:
            List of LogDocument objects.
        """
        documents = []
        for entry in entries:
            try:
                doc = LogDocument(
                    id=entry.get("id", f"seed-{len(documents)}"),
                    timestamp=entry.get("timestamp", datetime.now().isoformat()),
                    logLevel=entry.get("logLevel", "INFO"),
                    serviceName=entry.get("serviceName", "unknown-service"),
                    message=entry.get("message", ""),
                    stackTrace=entry.get("stackTrace"),
                    category=entry.get("category", "general"),
                    severity=entry.get("severity", "low"),
                )
                documents.append(doc)
            except Exception as e:
                logger.warning(f"Failed to convert entry: {e}")
                continue

        return documents

    def _generate_logs_from_template(
        self, category: str, template: Dict[str, Any], count: int
    ) -> List[Dict[str, Any]]:
        """Generate synthetic log entries from a template.

        Args:
            category: Category name.
            template: Template definition.
            count: Number of entries to generate.

        Returns:
            List of generated log entries.
        """
        logs = []
        keywords = template.get("common_keywords", [])
        causes = template.get("typical_causes", [])
        severity_keywords = template.get("severity_keywords", {})

        for i in range(count):
            # Rotate through causes and keywords
            cause = causes[i % len(causes)] if causes else "Unknown cause"
            keyword = keywords[i % len(keywords)] if keywords else category

            # Determine severity
            severity = "medium"
            for sev, kws in severity_keywords.items():
                if keyword.lower() in [k.lower() for k in kws]:
                    severity = sev
                    break

            # Determine log level based on severity
            log_level = {
                "critical": "ERROR",
                "high": "ERROR",
                "medium": "WARN",
                "low": "INFO",
            }.get(severity, "INFO")

            log_entry = {
                "id": f"template-{category}-{i:03d}",
                "timestamp": datetime.now().isoformat(),
                "logLevel": log_level,
                "serviceName": f"{category}-service",
                "message": f"{cause} - Keyword: {keyword}",
                "category": category,
                "severity": severity,
            }
            logs.append(log_entry)

        return logs

    def _detect_category_from_content(self, title: str, content: str) -> str:
        """Detect category from VOC title and content.

        Args:
            title: VOC title.
            content: VOC content.

        Returns:
            Detected category or 'general'.
        """
        text = f"{title} {content}"
        matches = find_matching_categories(text)
        if matches:
            return matches[0][0]
        return "general"
