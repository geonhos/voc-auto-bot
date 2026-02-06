"""Data seeder service for initializing vector database with seed data."""

import json
import logging
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import List, Optional

from app.models.schemas import LogDocument
from app.data.log_templates import LOG_TEMPLATES, get_all_categories

logger = logging.getLogger(__name__)


class SeedingStatus(str, Enum):
    """Status of the seeding operation."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class SeedingResult:
    """Result of a seeding operation."""
    status: SeedingStatus
    total_entries: int
    seeded_entries: int
    failed_entries: int
    categories_covered: List[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    error_message: Optional[str] = None


class DataSeederService:
    """Service for seeding vector database with initial log data."""

    def __init__(self, embedding_service=None):
        """Initialize data seeder service.

        Args:
            embedding_service: Optional embedding service for vector operations.
        """
        self.embedding_service = embedding_service
        self._status = SeedingStatus.NOT_STARTED
        self._last_result: Optional[SeedingResult] = None
        self._seeded_count = 0
        self._categories_seeded: List[str] = []

    def seed_from_file(self, file_path: str) -> SeedingResult:
        """Seed vector database from a JSON file.

        Args:
            file_path: Path to JSON file containing log entries.

        Returns:
            SeedingResult with operation status and statistics.
        """
        started_at = datetime.now()
        self._status = SeedingStatus.IN_PROGRESS

        try:
            # Load log data from file
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"Seed file not found: {file_path}")

            with open(path, "r", encoding="utf-8") as f:
                logs_data = json.load(f)

            if not isinstance(logs_data, list):
                raise ValueError("Seed file must contain a JSON array of log entries")

            # Convert to LogDocument objects
            log_documents: List[LogDocument] = []
            failed_count = 0
            categories_set = set()

            for entry in logs_data:
                try:
                    log_doc = LogDocument(**entry)
                    log_documents.append(log_doc)
                    categories_set.add(entry.get("category", "unknown"))
                except Exception as e:
                    logger.warning(f"Failed to parse log entry: {e}")
                    failed_count += 1

            # Seed to vector store if embedding service available
            if self.embedding_service:
                self.embedding_service.initialize_vectorstore(log_documents)

            # Update internal state
            self._seeded_count = len(log_documents)
            self._categories_seeded = list(categories_set)
            self._status = SeedingStatus.COMPLETED

            result = SeedingResult(
                status=SeedingStatus.COMPLETED,
                total_entries=len(logs_data),
                seeded_entries=len(log_documents),
                failed_entries=failed_count,
                categories_covered=list(categories_set),
                started_at=started_at,
                completed_at=datetime.now()
            )
            self._last_result = result
            logger.info(f"Seeding completed: {len(log_documents)} entries from {file_path}")
            return result

        except Exception as e:
            self._status = SeedingStatus.FAILED
            error_msg = str(e)
            logger.error(f"Seeding failed: {error_msg}")

            result = SeedingResult(
                status=SeedingStatus.FAILED,
                total_entries=0,
                seeded_entries=0,
                failed_entries=0,
                categories_covered=[],
                started_at=started_at,
                completed_at=datetime.now(),
                error_message=error_msg
            )
            self._last_result = result
            return result

    def seed_from_templates(self) -> SeedingResult:
        """Generate and seed synthetic log data from templates.

        Creates synthetic log entries based on LOG_TEMPLATES categories.

        Returns:
            SeedingResult with operation status and statistics.
        """
        started_at = datetime.now()
        self._status = SeedingStatus.IN_PROGRESS

        try:
            log_documents: List[LogDocument] = []
            categories = get_all_categories()

            for idx, category in enumerate(categories):
                template = LOG_TEMPLATES.get(category, {})
                keywords = template.get("common_keywords", [])
                causes = template.get("typical_causes", [])

                # Generate synthetic logs for each category
                for i, cause in enumerate(causes[:5]):  # Up to 5 logs per category
                    log_doc = LogDocument(
                        id=f"template-{category}-{i:03d}",
                        timestamp=datetime.now().isoformat() + "Z",
                        logLevel="ERROR" if i % 3 == 0 else "WARN" if i % 3 == 1 else "INFO",
                        serviceName=f"{category}-service",
                        message=f"{cause}. Keywords: {', '.join(keywords[:3])}",
                        category=category,
                        severity="high" if i % 2 == 0 else "medium"
                    )
                    log_documents.append(log_doc)

            # Seed to vector store if embedding service available
            if self.embedding_service:
                self.embedding_service.initialize_vectorstore(log_documents)

            # Update internal state
            self._seeded_count = len(log_documents)
            self._categories_seeded = categories
            self._status = SeedingStatus.COMPLETED

            result = SeedingResult(
                status=SeedingStatus.COMPLETED,
                total_entries=len(log_documents),
                seeded_entries=len(log_documents),
                failed_entries=0,
                categories_covered=categories,
                started_at=started_at,
                completed_at=datetime.now()
            )
            self._last_result = result
            logger.info(f"Template seeding completed: {len(log_documents)} entries generated")
            return result

        except Exception as e:
            self._status = SeedingStatus.FAILED
            error_msg = str(e)
            logger.error(f"Template seeding failed: {error_msg}")

            result = SeedingResult(
                status=SeedingStatus.FAILED,
                total_entries=0,
                seeded_entries=0,
                failed_entries=0,
                categories_covered=[],
                started_at=started_at,
                completed_at=datetime.now(),
                error_message=error_msg
            )
            self._last_result = result
            return result

    def seed_from_resolved_voc(
        self,
        voc_id: str,
        title: str,
        content: str,
        resolution: str,
        category: str
    ) -> bool:
        """Seed a single resolved VOC entry for progressive learning.

        Args:
            voc_id: VOC identifier
            title: VOC title
            content: VOC content
            resolution: Resolution/solution applied
            category: Category of the VOC

        Returns:
            True if seeding successful, False otherwise
        """
        try:
            # Create log document from resolved VOC
            log_doc = LogDocument(
                id=f"voc-resolved-{voc_id}",
                timestamp=datetime.now().isoformat() + "Z",
                logLevel="INFO",
                serviceName="voc-service",
                message=f"[VOC Resolution] {title}: {resolution}",
                category=category,
                severity="low"
            )

            # Add to vector store if embedding service available
            if self.embedding_service and self.embedding_service.is_initialized():
                # Add single document to existing vectorstore
                from langchain_core.documents import Document
                doc = Document(
                    page_content=log_doc.to_text(),
                    metadata=log_doc.to_metadata()
                )
                self.embedding_service.vectorstore.add_documents([doc])
                logger.info(f"Added resolved VOC to vector store: {voc_id}")
                return True
            else:
                logger.warning("Embedding service not available for progressive learning")
                return False

        except Exception as e:
            logger.error(f"Failed to seed resolved VOC {voc_id}: {e}")
            return False

    def get_seeding_status(self) -> dict:
        """Get current seeding status.

        Returns:
            Dictionary with status information.
        """
        return {
            "status": self._status.value,
            "seeded_entries": self._seeded_count,
            "categories_covered": self._categories_seeded,
            "last_result": self._format_result(self._last_result) if self._last_result else None
        }

    def _format_result(self, result: SeedingResult) -> dict:
        """Format SeedingResult to dictionary.

        Args:
            result: SeedingResult to format

        Returns:
            Dictionary representation
        """
        return {
            "status": result.status.value,
            "total_entries": result.total_entries,
            "seeded_entries": result.seeded_entries,
            "failed_entries": result.failed_entries,
            "categories_covered": result.categories_covered,
            "started_at": result.started_at.isoformat() if result.started_at else None,
            "completed_at": result.completed_at.isoformat() if result.completed_at else None,
            "error_message": result.error_message
        }

    def is_seeded(self) -> bool:
        """Check if seeding has been completed.

        Returns:
            True if seeding completed successfully
        """
        return self._status == SeedingStatus.COMPLETED and self._seeded_count > 0
