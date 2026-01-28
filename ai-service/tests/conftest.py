"""Pytest configuration and fixtures for VOC AI Service tests."""

import pytest
from typing import Generator
from pathlib import Path
import json

from app.models.schemas import LogDocument
from app.services.embedding_service import EmbeddingService


@pytest.fixture
def mock_logs_data() -> list[dict]:
    """Load mock logs data for testing.

    Returns:
        List of mock log dictionaries.
    """
    mock_logs_path = Path(__file__).parent.parent / "app" / "data" / "mock_logs.json"
    with open(mock_logs_path, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def log_documents(mock_logs_data: list[dict]) -> list[LogDocument]:
    """Create LogDocument instances from mock data.

    Args:
        mock_logs_data: Mock logs data.

    Returns:
        List of LogDocument objects.
    """
    return [LogDocument(**log) for log in mock_logs_data]


@pytest.fixture
def sample_voc_payment() -> dict:
    """Sample VOC about payment timeout.

    Returns:
        Dictionary with title and content.
    """
    return {
        "title": "결제 오류 발생",
        "content": "결제 진행 중 타임아웃 오류가 발생했습니다. 30초 후 연결 실패 메시지가 표시됩니다.",
    }


@pytest.fixture
def sample_voc_auth() -> dict:
    """Sample VOC about authentication.

    Returns:
        Dictionary with title and content.
    """
    return {
        "title": "로그인 오류",
        "content": "로그인 시도 시 토큰이 만료되었다는 메시지가 나옵니다.",
    }


@pytest.fixture
def sample_voc_database() -> dict:
    """Sample VOC about database.

    Returns:
        Dictionary with title and content.
    """
    return {
        "title": "데이터 조회 실패",
        "content": "VOC 목록을 불러오는 중 데이터베이스 연결 오류가 발생합니다.",
    }
