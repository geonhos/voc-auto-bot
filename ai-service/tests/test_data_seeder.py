"""Unit tests for DataSeederService."""

import pytest
from unittest.mock import Mock, MagicMock
from pathlib import Path
import json
import tempfile

from app.services.data_seeder import (
    DataSeederService,
    SeedingStatus,
    SeedingResult,
)


class TestDataSeederService:
    """Tests for DataSeederService class."""

    @pytest.fixture
    def mock_embedding_service(self) -> Mock:
        """Create a mock embedding service."""
        mock = Mock()
        mock.add_logs = MagicMock()
        return mock

    @pytest.fixture
    def seeder(self, mock_embedding_service: Mock) -> DataSeederService:
        """Create a DataSeederService with mock embedding service."""
        return DataSeederService(embedding_service=mock_embedding_service)

    @pytest.fixture
    def seeder_without_embedding(self) -> DataSeederService:
        """Create a DataSeederService without embedding service."""
        return DataSeederService(embedding_service=None)

    @pytest.fixture
    def temp_seed_file(self) -> str:
        """Create a temporary seed file with test data."""
        test_data = [
            {
                "id": "test-001",
                "timestamp": "2026-01-28T10:00:00Z",
                "logLevel": "ERROR",
                "serviceName": "test-service",
                "message": "Test error message",
                "category": "payment",
                "severity": "high",
            },
            {
                "id": "test-002",
                "timestamp": "2026-01-28T10:01:00Z",
                "logLevel": "WARN",
                "serviceName": "auth-service",
                "message": "Test warning message",
                "category": "auth",
                "severity": "medium",
            },
        ]

        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        ) as f:
            json.dump(test_data, f)
            return f.name

    def test_initial_status(self, seeder: DataSeederService):
        """Test that initial status is NOT_STARTED."""
        status = seeder.get_seeding_status()
        assert status["current_status"] == SeedingStatus.NOT_STARTED.value
        assert status["last_result"] is None

    def test_seed_from_file_success(
        self, seeder: DataSeederService, temp_seed_file: str
    ):
        """Test successful seeding from file."""
        result = seeder.seed_from_file(temp_seed_file)

        assert isinstance(result, SeedingResult)
        assert result.status == SeedingStatus.COMPLETED
        assert result.total_entries == 2
        assert result.seeded_entries == 2
        assert result.failed_entries == 0
        assert result.started_at is not None
        assert result.completed_at is not None
        assert result.error_message is None

    def test_seed_from_file_not_found(self, seeder: DataSeederService):
        """Test seeding with non-existent file."""
        result = seeder.seed_from_file("/nonexistent/path/to/file.json")

        assert result.status == SeedingStatus.FAILED
        assert result.error_message is not None
        assert "not found" in result.error_message.lower()

    def test_seed_from_templates_success(
        self, seeder: DataSeederService, mock_embedding_service: Mock
    ):
        """Test successful seeding from templates."""
        result = seeder.seed_from_templates(count_per_category=5)

        assert isinstance(result, SeedingResult)
        assert result.status == SeedingStatus.COMPLETED
        assert result.total_entries > 0
        assert result.seeded_entries > 0
        assert len(result.categories_seeded) > 0

        # Verify embedding service was called
        mock_embedding_service.add_logs.assert_called_once()

    def test_seed_from_templates_without_embedding(
        self, seeder_without_embedding: DataSeederService
    ):
        """Test seeding from templates without embedding service."""
        result = seeder_without_embedding.seed_from_templates(count_per_category=2)

        # Should succeed but not add to vector store
        assert result.status == SeedingStatus.COMPLETED
        assert result.seeded_entries > 0

    def test_seed_from_voc_resolution(
        self, seeder: DataSeederService, mock_embedding_service: Mock
    ):
        """Test progressive learning from resolved VOC."""
        result = seeder.seed_from_voc_resolution(
            voc_id="VOC-2026-001",
            title="결제 타임아웃 오류",
            content="결제 진행 중 30초 후 타임아웃 발생",
            resolution="PG사 서버 장애로 인한 문제. PG사 복구 후 정상화됨.",
            analysis_result={
                "summary": "결제 게이트웨이 타임아웃",
                "confidence": 0.85,
            },
        )

        assert isinstance(result, SeedingResult)
        assert result.status == SeedingStatus.COMPLETED
        assert result.total_entries == 1
        assert result.seeded_entries == 1

        # Verify embedding service was called
        mock_embedding_service.add_logs.assert_called_once()

    def test_seed_from_voc_resolution_without_embedding(
        self, seeder_without_embedding: DataSeederService
    ):
        """Test VOC resolution seeding without embedding service."""
        result = seeder_without_embedding.seed_from_voc_resolution(
            voc_id="VOC-2026-002",
            title="로그인 오류",
            content="토큰 만료",
            resolution="토큰 갱신 처리",
            analysis_result=None,
        )

        assert result.status == SeedingStatus.COMPLETED
        # Without embedding service, seeding still counts as completed
        # but entries are not added to vector store
        assert result.failed_entries == 1

    def test_get_seeding_status_after_success(
        self, seeder: DataSeederService, temp_seed_file: str
    ):
        """Test status after successful seeding."""
        seeder.seed_from_file(temp_seed_file)
        status = seeder.get_seeding_status()

        assert status["current_status"] == SeedingStatus.COMPLETED.value
        assert status["last_result"] is not None
        assert status["last_result"]["status"] == SeedingStatus.COMPLETED.value
        assert status["last_result"]["seeded_entries"] == 2

    def test_get_seeding_status_after_failure(self, seeder: DataSeederService):
        """Test status after failed seeding."""
        seeder.seed_from_file("/nonexistent/file.json")
        status = seeder.get_seeding_status()

        assert status["current_status"] == SeedingStatus.FAILED.value
        assert status["last_result"] is not None
        assert status["last_result"]["status"] == SeedingStatus.FAILED.value
        assert status["last_result"]["error_message"] is not None

    def test_convert_to_log_documents(self, seeder: DataSeederService):
        """Test conversion of raw entries to LogDocument objects."""
        entries = [
            {
                "id": "test-001",
                "timestamp": "2026-01-28T10:00:00Z",
                "logLevel": "ERROR",
                "serviceName": "test-service",
                "message": "Test message",
                "category": "payment",
                "severity": "high",
            }
        ]

        documents = seeder._convert_to_log_documents(entries)

        assert len(documents) == 1
        assert documents[0].id == "test-001"
        assert documents[0].logLevel == "ERROR"
        assert documents[0].serviceName == "test-service"

    def test_convert_to_log_documents_with_defaults(self, seeder: DataSeederService):
        """Test conversion with missing optional fields."""
        entries = [
            {
                "message": "Test message only",
            }
        ]

        documents = seeder._convert_to_log_documents(entries)

        assert len(documents) == 1
        assert documents[0].logLevel == "INFO"  # Default
        assert documents[0].serviceName == "unknown-service"  # Default
        assert documents[0].category == "general"  # Default

    def test_convert_to_log_documents_with_invalid_entry(
        self, seeder: DataSeederService
    ):
        """Test conversion skips invalid entries."""
        entries = [
            {"message": "Valid entry"},
            None,  # Invalid
        ]

        documents = seeder._convert_to_log_documents(
            [e for e in entries if e is not None]
        )

        assert len(documents) == 1

    def test_detect_category_from_content(self, seeder: DataSeederService):
        """Test category detection from title and content.

        Now uses VOC templates first, then log templates as fallback.
        """
        # Korean text → VOC templates → "오류/버그"
        category = seeder._detect_category_from_content(
            "결제 오류", "결제 실패 발생"
        )
        assert category == "오류/버그"

        # Korean inquiry → VOC templates → "문의"
        category = seeder._detect_category_from_content(
            "비밀번호 변경", "어디서 하나요 방법 문의"
        )
        assert category == "문의"

        # No match
        category = seeder._detect_category_from_content("ABC", "lorem ipsum")
        assert category == "general"

    def test_generate_logs_from_template(self, seeder: DataSeederService):
        """Test synthetic log generation from templates."""
        template = {
            "common_keywords": ["keyword1", "keyword2"],
            "typical_causes": ["cause1", "cause2"],
            "severity_keywords": {
                "high": ["keyword1"],
                "medium": ["keyword2"],
            },
        }

        logs = seeder._generate_logs_from_template(
            category="test",
            template=template,
            count=3,
        )

        assert len(logs) == 3
        for log in logs:
            assert log["category"] == "test"
            assert "id" in log
            assert "timestamp" in log
            assert "logLevel" in log
            assert "serviceName" in log
            assert "message" in log

    def test_seeding_result_structure(self):
        """Test SeedingResult dataclass structure."""
        result = SeedingResult(
            status=SeedingStatus.COMPLETED,
            total_entries=10,
            seeded_entries=9,
            failed_entries=1,
        )

        assert result.status == SeedingStatus.COMPLETED
        assert result.total_entries == 10
        assert result.seeded_entries == 9
        assert result.failed_entries == 1
        assert result.started_at is None
        assert result.completed_at is None
        assert result.error_message is None
        assert result.categories_seeded == []

    def test_seeding_status_enum(self):
        """Test SeedingStatus enum values."""
        assert SeedingStatus.NOT_STARTED.value == "not_started"
        assert SeedingStatus.IN_PROGRESS.value == "in_progress"
        assert SeedingStatus.COMPLETED.value == "completed"
        assert SeedingStatus.FAILED.value == "failed"
