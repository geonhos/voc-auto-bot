"""Tests for AnalysisService."""

import pytest
from unittest.mock import Mock, patch

from app.models.schemas import AnalysisRequest, AnalysisResponse, LogDocument
from app.services.analysis_service import AnalysisService
from app.services.embedding_service import EmbeddingService


class TestAnalysisService:
    """Tests for AnalysisService."""

    @pytest.fixture
    def mock_embedding_service(self):
        """Create mock embedding service.

        Returns:
            Mock EmbeddingService.
        """
        service = Mock(spec=EmbeddingService)
        return service

    @pytest.fixture
    def analysis_service(self, mock_embedding_service):
        """Create analysis service with mocked dependencies.

        Args:
            mock_embedding_service: Mock embedding service.

        Returns:
            AnalysisService instance.
        """
        with patch("app.services.analysis_service.Ollama"):
            service = AnalysisService(
                embedding_service=mock_embedding_service,
                model_name="llama3.2:latest",
                ollama_base_url="http://localhost:11434",
            )
            return service

    def test_format_logs_for_context(self, analysis_service):
        """Test formatting logs for LLM context."""
        logs = [
            (
                LogDocument(
                    id="log-001",
                    timestamp="2026-01-28T10:15:23.456Z",
                    logLevel="ERROR",
                    serviceName="payment-service",
                    message="Payment timeout",
                    category="payment",
                    severity="high",
                ),
                0.95,
            ),
            (
                LogDocument(
                    id="log-002",
                    timestamp="2026-01-28T10:15:24.456Z",
                    logLevel="WARN",
                    serviceName="payment-service",
                    message="Retry attempt",
                    category="payment",
                    severity="medium",
                ),
                0.85,
            ),
        ]

        context = analysis_service._format_logs_for_context(logs)

        assert "[2026-01-28T10:15:23.456Z]" in context
        assert "[ERROR]" in context
        assert "[payment-service]" in context
        assert "Payment timeout" in context
        assert "(Relevance: 0.95)" in context
        assert "Retry attempt" in context

    def test_create_rag_prompt(self, analysis_service):
        """Test creating RAG prompt."""
        request = AnalysisRequest(title="결제 오류", content="타임아웃 발생")
        logs_context = "[2026-01-28T10:15:23.456Z] [ERROR] [payment-service] Payment timeout"

        prompt = analysis_service._create_rag_prompt(request, logs_context)

        assert "결제 오류" in prompt
        assert "타임아웃 발생" in prompt
        assert "[ERROR]" in prompt
        assert "Payment timeout" in prompt
        assert "summary" in prompt.lower()
        assert "confidence" in prompt.lower()
        assert "keywords" in prompt.lower()

    def test_parse_llm_response_valid_json(self, analysis_service):
        """Test parsing valid LLM response."""
        response = """
        {
          "summary": "결제 게이트웨이 타임아웃 발생",
          "confidence": 0.92,
          "keywords": ["payment", "timeout", "gateway"],
          "possibleCauses": ["네트워크 지연", "서버 과부하"],
          "recommendation": "서버 상태 확인 필요"
        }
        """

        result = analysis_service._parse_llm_response(response)

        assert result["summary"] == "결제 게이트웨이 타임아웃 발생"
        assert result["confidence"] == 0.92
        assert len(result["keywords"]) == 3
        assert len(result["possibleCauses"]) == 2

    def test_parse_llm_response_with_markdown(self, analysis_service):
        """Test parsing LLM response with markdown code blocks."""
        response = """
        ```json
        {
          "summary": "인증 토큰 만료",
          "confidence": 0.88,
          "keywords": ["auth", "token", "expired"],
          "possibleCauses": ["토큰 유효 시간 부족"],
          "recommendation": "토큰 갱신 필요"
        }
        ```
        """

        result = analysis_service._parse_llm_response(response)

        assert result["summary"] == "인증 토큰 만료"
        assert result["confidence"] == 0.88

    def test_parse_llm_response_clamps_confidence(self, analysis_service):
        """Test that confidence is clamped to [0, 1]."""
        response = """
        {
          "summary": "테스트",
          "confidence": 1.5,
          "keywords": ["test"],
          "possibleCauses": ["원인"],
          "recommendation": "조치"
        }
        """

        result = analysis_service._parse_llm_response(response)

        assert result["confidence"] == 1.0

    def test_parse_llm_response_missing_fields_raises_error(
        self, analysis_service
    ):
        """Test that missing required fields raises error."""
        response = """
        {
          "summary": "테스트",
          "confidence": 0.5
        }
        """

        with pytest.raises(ValueError, match="Missing required fields"):
            analysis_service._parse_llm_response(response)

    def test_parse_llm_response_invalid_json_raises_error(
        self, analysis_service
    ):
        """Test that invalid JSON raises error."""
        response = "This is not JSON"

        with pytest.raises(ValueError, match="No JSON found"):
            analysis_service._parse_llm_response(response)

    def test_convert_to_related_logs(self, analysis_service):
        """Test converting similar logs to RelatedLog format."""
        logs = [
            (
                LogDocument(
                    id="log-001",
                    timestamp="2026-01-28T10:15:23.456Z",
                    logLevel="ERROR",
                    serviceName="payment-service",
                    message="Payment timeout",
                    category="payment",
                    severity="high",
                ),
                0.9523,
            ),
            (
                LogDocument(
                    id="log-002",
                    timestamp="2026-01-28T10:15:24.456Z",
                    logLevel="WARN",
                    serviceName="payment-service",
                    message="Retry attempt",
                    category="payment",
                    severity="medium",
                ),
                0.8512,
            ),
        ]

        related_logs = analysis_service._convert_to_related_logs(logs)

        assert len(related_logs) == 2
        assert related_logs[0].relevanceScore == 0.95  # Rounded
        assert related_logs[1].relevanceScore == 0.85  # Rounded
        assert related_logs[0].message == "Payment timeout"

    def test_create_empty_response(self, analysis_service):
        """Test creating empty response."""
        response = analysis_service._create_empty_response("테스트 이유")

        assert isinstance(response, AnalysisResponse)
        assert response.summary == "테스트 이유"
        assert response.confidence == 0.0
        assert len(response.keywords) == 0
        assert len(response.possibleCauses) == 0
        assert len(response.relatedLogs) == 0

    def test_analyze_voc_no_similar_logs(
        self, analysis_service, mock_embedding_service
    ):
        """Test analyze_voc when no similar logs are found."""
        mock_embedding_service.search_similar_logs.return_value = []

        request = AnalysisRequest(title="테스트", content="테스트 내용")

        response = analysis_service.analyze_voc(request)

        assert response.confidence == 0.0
        assert "관련 로그를 찾을 수 없습니다" in response.summary


@pytest.mark.integration
class TestAnalysisServiceIntegration:
    """Integration tests for AnalysisService (requires Ollama)."""

    @pytest.fixture
    def embedding_service(self, log_documents):
        """Create and initialize embedding service.

        Args:
            log_documents: List of log documents.

        Returns:
            Initialized EmbeddingService.
        """
        service = EmbeddingService(
            model_name="nomic-embed-text",
            ollama_base_url="http://localhost:11434",
            persist_directory="./test_chroma_db",
        )

        try:
            service.initialize_vectorstore(log_documents)
        except Exception as e:
            pytest.skip(f"Ollama not available: {e}")

        return service

    @pytest.fixture
    def analysis_service(self, embedding_service):
        """Create analysis service with real dependencies.

        Args:
            embedding_service: Real embedding service.

        Returns:
            AnalysisService instance.
        """
        try:
            service = AnalysisService(
                embedding_service=embedding_service,
                model_name="llama3.2:latest",
                ollama_base_url="http://localhost:11434",
            )
            return service
        except Exception as e:
            pytest.skip(f"Ollama not available: {e}")

    def test_analyze_voc_payment_timeout(
        self, analysis_service, sample_voc_payment
    ):
        """Test analyzing payment timeout VOC."""
        request = AnalysisRequest(**sample_voc_payment)

        response = analysis_service.analyze_voc(request)

        assert isinstance(response, AnalysisResponse)
        assert response.confidence > 0.0
        assert len(response.keywords) > 0
        assert len(response.possibleCauses) > 0
        assert len(response.relatedLogs) > 0
        assert response.recommendation != ""

        # Should mention payment or timeout
        assert any(
            keyword in ["payment", "timeout", "gateway"]
            for keyword in response.keywords
        )

    def test_analyze_voc_auth_token(self, analysis_service, sample_voc_auth):
        """Test analyzing authentication token VOC."""
        request = AnalysisRequest(**sample_voc_auth)

        response = analysis_service.analyze_voc(request)

        assert isinstance(response, AnalysisResponse)
        assert response.confidence > 0.0
        assert len(response.relatedLogs) > 0

        # Should mention auth or token
        keywords_lower = [k.lower() for k in response.keywords]
        assert any(keyword in ["auth", "token", "jwt"] for keyword in keywords_lower)

    def test_analyze_voc_database_connection(
        self, analysis_service, sample_voc_database
    ):
        """Test analyzing database connection VOC."""
        request = AnalysisRequest(**sample_voc_database)

        response = analysis_service.analyze_voc(request)

        assert isinstance(response, AnalysisResponse)
        assert response.confidence > 0.0
        assert len(response.relatedLogs) > 0

        # Related logs should be database-related
        db_logs = [
            log
            for log in response.relatedLogs
            if "database" in log.serviceName.lower()
            or "database" in log.message.lower()
        ]
        assert len(db_logs) > 0

    def test_analyze_voc_response_structure(
        self, analysis_service, sample_voc_payment
    ):
        """Test that analysis response has correct structure."""
        request = AnalysisRequest(**sample_voc_payment)

        response = analysis_service.analyze_voc(request)

        # Validate response structure
        assert hasattr(response, "summary")
        assert hasattr(response, "confidence")
        assert hasattr(response, "keywords")
        assert hasattr(response, "possibleCauses")
        assert hasattr(response, "relatedLogs")
        assert hasattr(response, "recommendation")

        # Validate types
        assert isinstance(response.summary, str)
        assert isinstance(response.confidence, float)
        assert isinstance(response.keywords, list)
        assert isinstance(response.possibleCauses, list)
        assert isinstance(response.relatedLogs, list)
        assert isinstance(response.recommendation, str)

        # Validate confidence bounds
        assert 0.0 <= response.confidence <= 1.0

        # Validate related logs have relevance scores
        for log in response.relatedLogs:
            assert 0.0 <= log.relevanceScore <= 1.0
