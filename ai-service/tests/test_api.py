"""Tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch

from app.models.schemas import AnalysisResponse, RelatedLog


@pytest.fixture
def client():
    """Create FastAPI test client.

    Returns:
        TestClient instance.
    """
    # Import here to avoid issues with lifespan
    from main import app

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def mock_analysis_response():
    """Create mock analysis response.

    Returns:
        Mock AnalysisResponse.
    """
    return AnalysisResponse(
        summary="결제 게이트웨이 타임아웃으로 인한 결제 실패",
        confidence=0.92,
        keywords=["payment", "timeout", "gateway"],
        possibleCauses=[
            "결제 게이트웨이 서버 응답 지연",
            "네트워크 연결 불안정",
        ],
        relatedLogs=[
            RelatedLog(
                timestamp="2026-01-28T10:15:23.456Z",
                logLevel="ERROR",
                serviceName="payment-service",
                message="Payment gateway timeout",
                relevanceScore=0.95,
            )
        ],
        recommendation="결제 게이트웨이 서버 상태 확인 필요",
    )


class TestRootEndpoint:
    """Tests for root endpoint."""

    def test_root_endpoint(self, client):
        """Test root endpoint returns service info."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        assert data["service"] == "VOC Log Analysis AI Service"
        assert data["version"] == "1.0.0"
        assert data["status"] == "running"
        assert data["docs"] == "/docs"


class TestHealthEndpoint:
    """Tests for health check endpoint."""

    @pytest.mark.skip(reason="Requires Ollama initialization")
    def test_health_endpoint_healthy(self, client):
        """Test health endpoint when service is healthy."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert "vectorstore_initialized" in data

    def test_health_endpoint_structure(self, client):
        """Test health endpoint returns correct structure."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert "status" in data
        assert "version" in data
        assert "vectorstore_initialized" in data


class TestAnalyzeEndpoint:
    """Tests for analyze endpoint."""

    @pytest.mark.skip(reason="Requires Ollama initialization")
    def test_analyze_endpoint_valid_request(self, client):
        """Test analyze endpoint with valid request."""
        request_data = {
            "title": "결제 오류 발생",
            "content": "결제 진행 중 타임아웃 오류가 발생했습니다.",
        }

        response = client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert "summary" in data
        assert "confidence" in data
        assert "keywords" in data
        assert "possibleCauses" in data
        assert "relatedLogs" in data
        assert "recommendation" in data

    def test_analyze_endpoint_missing_title(self, client):
        """Test analyze endpoint with missing title."""
        request_data = {"content": "결제 진행 중 타임아웃 오류가 발생했습니다."}

        response = client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_analyze_endpoint_missing_content(self, client):
        """Test analyze endpoint with missing content."""
        request_data = {"title": "결제 오류 발생"}

        response = client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_analyze_endpoint_empty_title(self, client):
        """Test analyze endpoint with empty title."""
        request_data = {
            "title": "",
            "content": "결제 진행 중 타임아웃 오류가 발생했습니다.",
        }

        response = client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_analyze_endpoint_empty_content(self, client):
        """Test analyze endpoint with empty content."""
        request_data = {"title": "결제 오류 발생", "content": ""}

        response = client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_analyze_endpoint_too_long_title(self, client):
        """Test analyze endpoint with too long title."""
        request_data = {
            "title": "x" * 501,
            "content": "결제 진행 중 타임아웃 오류가 발생했습니다.",
        }

        response = client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 422  # Validation error

    def test_analyze_endpoint_too_long_content(self, client):
        """Test analyze endpoint with too long content."""
        request_data = {"title": "결제 오류 발생", "content": "x" * 5001}

        response = client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 422  # Validation error


@pytest.mark.integration
class TestAnalyzeEndpointIntegration:
    """Integration tests for analyze endpoint (requires Ollama)."""

    @pytest.fixture
    def initialized_client(self):
        """Create test client with initialized services.

        Returns:
            TestClient with initialized services.
        """
        from main import app

        # This requires Ollama to be running
        try:
            with TestClient(app) as test_client:
                # Wait for initialization
                import time

                time.sleep(2)
                yield test_client
        except Exception as e:
            pytest.skip(f"Ollama not available: {e}")

    def test_analyze_payment_timeout(self, initialized_client):
        """Test analyzing payment timeout issue."""
        request_data = {
            "title": "결제 오류 발생",
            "content": "결제 진행 중 타임아웃 오류가 발생했습니다. 30초 후 연결 실패 메시지가 표시됩니다.",
        }

        response = initialized_client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert data["confidence"] > 0.0
        assert len(data["keywords"]) > 0
        assert len(data["possibleCauses"]) > 0
        assert len(data["relatedLogs"]) > 0

        # Should find payment-related logs
        payment_logs = [
            log
            for log in data["relatedLogs"]
            if "payment" in log["serviceName"].lower()
        ]
        assert len(payment_logs) > 0

    def test_analyze_auth_token(self, initialized_client):
        """Test analyzing authentication token issue."""
        request_data = {
            "title": "로그인 오류",
            "content": "로그인 시도 시 토큰이 만료되었다는 메시지가 나옵니다.",
        }

        response = initialized_client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert data["confidence"] > 0.0
        assert len(data["relatedLogs"]) > 0

        # Should find auth-related logs
        auth_logs = [
            log
            for log in data["relatedLogs"]
            if "auth" in log["serviceName"].lower()
        ]
        assert len(auth_logs) > 0

    def test_analyze_database_connection(self, initialized_client):
        """Test analyzing database connection issue."""
        request_data = {
            "title": "데이터 조회 실패",
            "content": "VOC 목록을 불러오는 중 데이터베이스 연결 오류가 발생합니다.",
        }

        response = initialized_client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert data["confidence"] > 0.0
        assert len(data["relatedLogs"]) > 0

    def test_analyze_response_confidence_bounds(self, initialized_client):
        """Test that confidence is always between 0 and 1."""
        request_data = {
            "title": "시스템 오류",
            "content": "알 수 없는 오류가 발생했습니다.",
        }

        response = initialized_client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        assert 0.0 <= data["confidence"] <= 1.0

    def test_analyze_related_logs_have_scores(self, initialized_client):
        """Test that all related logs have relevance scores."""
        request_data = {
            "title": "결제 오류",
            "content": "결제 중 오류 발생",
        }

        response = initialized_client.post("/api/v1/analyze", json=request_data)

        assert response.status_code == 200
        data = response.json()

        for log in data["relatedLogs"]:
            assert "relevanceScore" in log
            assert 0.0 <= log["relevanceScore"] <= 1.0
