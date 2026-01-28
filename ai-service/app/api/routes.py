"""API routes for VOC log analysis service."""

from typing import Optional

from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalysisRequest, AnalysisResponse, HealthResponse
from app.services.embedding_service import EmbeddingService
from app.services.analysis_service import AnalysisService

router = APIRouter()

# Global service instances (initialized on startup)
embedding_service: Optional[EmbeddingService] = None
analysis_service: Optional[AnalysisService] = None


def initialize_services(
    ollama_base_url: str = "http://localhost:11434",
    embedding_model: str = "nomic-embed-text",
    llm_model: str = "llama3.2:latest",
) -> None:
    """Initialize services and load mock data.

    Args:
        ollama_base_url: Ollama server base URL.
        embedding_model: Embedding model name.
        llm_model: LLM model name.
    """
    global embedding_service, analysis_service

    # Initialize embedding service
    embedding_service = EmbeddingService(
        model_name=embedding_model, ollama_base_url=ollama_base_url
    )

    # Load mock logs and initialize vector store
    logs = embedding_service.load_mock_logs()
    embedding_service.initialize_vectorstore(logs)

    # Initialize analysis service
    analysis_service = AnalysisService(
        embedding_service=embedding_service,
        model_name=llm_model,
        ollama_base_url=ollama_base_url,
    )


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint.

    Returns:
        Service health status.
    """
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        vectorstore_initialized=embedding_service is not None
        and embedding_service.is_initialized(),
    )


@router.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_voc(request: AnalysisRequest) -> AnalysisResponse:
    """Analyze VOC with related logs.

    Args:
        request: VOC analysis request with title and content.

    Returns:
        Analysis result with summary, causes, logs, and recommendations.

    Raises:
        HTTPException: If services are not initialized or analysis fails.
    """
    if embedding_service is None or analysis_service is None:
        raise HTTPException(
            status_code=503,
            detail="Service not initialized. Please check Ollama server is running.",
        )

    if not embedding_service.is_initialized():
        raise HTTPException(
            status_code=503, detail="Vector store not initialized. Loading logs..."
        )

    try:
        result = analysis_service.analyze_voc(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
