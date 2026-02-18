"""Tests for EmbeddingService."""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

from app.models.schemas import LogDocument
from app.services.embedding_service import EmbeddingService


class TestEmbeddingService:
    """Unit tests for EmbeddingService (no external dependencies)."""

    def test_load_mock_logs(self):
        """Test loading mock logs from JSON."""
        service = EmbeddingService(
            model_name="bge-m3",
            ollama_base_url="http://localhost:11434",
        )

        logs = service.load_mock_logs()

        assert len(logs) > 0
        assert all(isinstance(log, LogDocument) for log in logs)

    def test_load_mock_logs_with_custom_path(self):
        """Test loading mock logs from custom path."""
        service = EmbeddingService()
        mock_logs_path = (
            Path(__file__).parent.parent / "app" / "data" / "mock_logs.json"
        )

        logs = service.load_mock_logs(str(mock_logs_path))

        assert len(logs) >= 30

    def test_is_initialized_false_by_default(self):
        """Test that vector store is not initialized by default."""
        service = EmbeddingService()

        assert service.is_initialized() is False

    def test_get_collection_count_no_pool(self):
        """Test that collection count returns 0 without pool."""
        service = EmbeddingService()

        assert service.get_collection_count() == 0

    def test_reset_vectorstore_no_pool_raises(self):
        """Test that reset without pool raises error."""
        service = EmbeddingService()

        with pytest.raises(RuntimeError, match="Database pool not provided"):
            service.reset_vectorstore()

    def test_search_similar_logs_not_initialized_raises_error(self):
        """Test that searching without initialization raises error."""
        service = EmbeddingService()

        with pytest.raises(RuntimeError, match="Vector store not initialized"):
            service.search_similar_logs("결제 오류")

    def test_add_logs_no_pool_raises(self):
        """Test that adding logs without pool raises error."""
        service = EmbeddingService()

        with pytest.raises(RuntimeError, match="Database pool not provided"):
            service.add_logs([])


@pytest.mark.integration
class TestEmbeddingServiceIntegration:
    """Integration tests for EmbeddingService (requires Ollama + PostgreSQL)."""

    @pytest.fixture
    def embedding_service(self, log_documents, db_pool):
        """Create and initialize embedding service.

        Args:
            log_documents: List of log documents.
            db_pool: PostgreSQL connection pool.

        Returns:
            Initialized EmbeddingService.
        """
        service = EmbeddingService(
            model_name="bge-m3",
            ollama_base_url="http://localhost:11434",
            db_pool=db_pool,
        )

        try:
            service.initialize_vectorstore(log_documents)
        except Exception as e:
            pytest.skip(f"Ollama or PostgreSQL not available: {e}")

        yield service

    def test_initialize_vectorstore(self, embedding_service):
        """Test vector store initialization."""
        assert embedding_service.is_initialized() is True
        assert embedding_service.get_collection_count() > 0

    def test_search_similar_logs_payment(
        self, embedding_service, sample_voc_payment
    ):
        """Test searching similar logs for payment issue."""
        query = f"{sample_voc_payment['title']} {sample_voc_payment['content']}"

        results = embedding_service.search_similar_logs(query, k=5)

        assert len(results) > 0
        assert len(results) <= 5
        assert all(isinstance(log, LogDocument) for log, _ in results)
        assert all(isinstance(score, float) for _, score in results)

        all_text = " ".join([
            f"{log.message} {log.serviceName} {log.category}".lower()
            for log, _ in results
        ])
        relevant_terms = ["payment", "timeout", "error", "gateway", "transaction", "결제"]
        assert any(term in all_text for term in relevant_terms)

    def test_search_similar_logs_auth(self, embedding_service, sample_voc_auth):
        """Test searching similar logs for authentication issue."""
        query = f"{sample_voc_auth['title']} {sample_voc_auth['content']}"

        results = embedding_service.search_similar_logs(query, k=5)

        assert len(results) > 0
        assert all(isinstance(log, LogDocument) for log, _ in results)
        assert all(isinstance(score, float) for _, score in results)

    def test_search_similar_logs_database(
        self, embedding_service, sample_voc_database
    ):
        """Test searching similar logs for database issue."""
        query = f"{sample_voc_database['title']} {sample_voc_database['content']}"

        results = embedding_service.search_similar_logs(query, k=3)

        assert len(results) > 0
        assert len(results) <= 3
        assert all(isinstance(log, LogDocument) for log, _ in results)
        assert all(isinstance(score, float) for _, score in results)

    def test_search_results_sorted_by_relevance(self, embedding_service):
        """Test that search results are sorted by relevance score."""
        results = embedding_service.search_similar_logs(
            "결제 타임아웃 오류", k=5
        )

        scores = [score for _, score in results]

        # Scores should be in descending order (highest similarity first)
        assert scores == sorted(scores, reverse=True)

    def test_search_with_different_k_values(self, embedding_service):
        """Test searching with different k values."""
        query = "결제 오류"

        results_3 = embedding_service.search_similar_logs(query, k=3)
        results_5 = embedding_service.search_similar_logs(query, k=5)

        assert len(results_3) <= 3
        assert len(results_5) <= 5
        assert len(results_5) >= len(results_3)

    def test_scores_in_valid_range(self, embedding_service):
        """Test that similarity scores are in [0, 1] range."""
        results = embedding_service.search_similar_logs("결제 오류", k=5)

        for _, score in results:
            assert 0.0 <= score <= 1.0, f"Score {score} out of [0, 1] range"
