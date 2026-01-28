"""Tests for Pydantic models."""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    RelatedLog,
    HealthResponse,
    LogDocument,
)


class TestAnalysisRequest:
    """Tests for AnalysisRequest model."""

    def test_valid_request(self):
        """Test valid analysis request."""
        request = AnalysisRequest(
            title="결제 오류", content="결제 중 타임아웃 발생"
        )

        assert request.title == "결제 오류"
        assert request.content == "결제 중 타임아웃 발생"

    def test_empty_title_fails(self):
        """Test that empty title raises validation error."""
        with pytest.raises(ValidationError):
            AnalysisRequest(title="", content="Some content")

    def test_empty_content_fails(self):
        """Test that empty content raises validation error."""
        with pytest.raises(ValidationError):
            AnalysisRequest(title="Some title", content="")

    def test_too_long_title_fails(self):
        """Test that too long title raises validation error."""
        with pytest.raises(ValidationError):
            AnalysisRequest(title="x" * 501, content="Some content")

    def test_too_long_content_fails(self):
        """Test that too long content raises validation error."""
        with pytest.raises(ValidationError):
            AnalysisRequest(title="Some title", content="x" * 5001)


class TestRelatedLog:
    """Tests for RelatedLog model."""

    def test_valid_related_log(self):
        """Test valid related log."""
        log = RelatedLog(
            timestamp="2026-01-28T10:15:23.456Z",
            logLevel="ERROR",
            serviceName="payment-service",
            message="Payment timeout",
            relevanceScore=0.95,
        )

        assert log.logLevel == "ERROR"
        assert log.relevanceScore == 0.95

    def test_relevance_score_below_zero_fails(self):
        """Test that relevance score below 0 fails."""
        with pytest.raises(ValidationError):
            RelatedLog(
                timestamp="2026-01-28T10:15:23.456Z",
                logLevel="ERROR",
                serviceName="payment-service",
                message="Test",
                relevanceScore=-0.1,
            )

    def test_relevance_score_above_one_fails(self):
        """Test that relevance score above 1 fails."""
        with pytest.raises(ValidationError):
            RelatedLog(
                timestamp="2026-01-28T10:15:23.456Z",
                logLevel="ERROR",
                serviceName="payment-service",
                message="Test",
                relevanceScore=1.1,
            )


class TestAnalysisResponse:
    """Tests for AnalysisResponse model."""

    def test_valid_response(self):
        """Test valid analysis response."""
        response = AnalysisResponse(
            summary="결제 타임아웃 발생",
            confidence=0.92,
            keywords=["payment", "timeout"],
            possibleCauses=["네트워크 지연", "서버 과부하"],
            relatedLogs=[
                RelatedLog(
                    timestamp="2026-01-28T10:15:23.456Z",
                    logLevel="ERROR",
                    serviceName="payment-service",
                    message="Payment timeout",
                    relevanceScore=0.95,
                )
            ],
            recommendation="서버 상태 확인 필요",
        )

        assert response.confidence == 0.92
        assert len(response.keywords) == 2
        assert len(response.relatedLogs) == 1

    def test_confidence_bounds(self):
        """Test confidence value bounds."""
        with pytest.raises(ValidationError):
            AnalysisResponse(
                summary="Test",
                confidence=1.5,
                keywords=[],
                possibleCauses=[],
                relatedLogs=[],
                recommendation="Test",
            )


class TestLogDocument:
    """Tests for LogDocument model."""

    def test_valid_log_document(self):
        """Test valid log document."""
        log = LogDocument(
            id="log-001",
            timestamp="2026-01-28T10:15:23.456Z",
            logLevel="ERROR",
            serviceName="payment-service",
            message="Payment timeout",
            category="payment",
            severity="high",
        )

        assert log.id == "log-001"
        assert log.logLevel == "ERROR"

    def test_to_text_conversion(self):
        """Test log to text conversion."""
        log = LogDocument(
            id="log-001",
            timestamp="2026-01-28T10:15:23.456Z",
            logLevel="ERROR",
            serviceName="payment-service",
            message="Payment timeout",
            stackTrace="java.net.SocketTimeoutException",
            category="payment",
            severity="high",
        )

        text = log.to_text()

        assert "[2026-01-28T10:15:23.456Z]" in text
        assert "[ERROR]" in text
        assert "[payment-service]" in text
        assert "Payment timeout" in text
        assert "StackTrace: java.net.SocketTimeoutException" in text

    def test_to_metadata_conversion(self):
        """Test log to metadata conversion."""
        log = LogDocument(
            id="log-001",
            timestamp="2026-01-28T10:15:23.456Z",
            logLevel="ERROR",
            serviceName="payment-service",
            message="Payment timeout",
            category="payment",
            severity="high",
        )

        metadata = log.to_metadata()

        assert metadata["id"] == "log-001"
        assert metadata["logLevel"] == "ERROR"
        assert metadata["serviceName"] == "payment-service"
        assert "stackTrace" not in metadata


class TestHealthResponse:
    """Tests for HealthResponse model."""

    def test_valid_health_response(self):
        """Test valid health response."""
        response = HealthResponse(
            status="healthy",
            version="1.0.0",
            vectorstore_initialized=True,
        )

        assert response.status == "healthy"
        assert response.version == "1.0.0"
        assert response.vectorstore_initialized is True
