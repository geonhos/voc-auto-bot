"""API routes for VOC log analysis service."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from app.api.dependencies import verify_api_key
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    HealthResponse,
    SeedRequest,
    SeedResponse,
    LearnRequest,
    SentimentRequest,
    SentimentResponse,
)
from app.services.embedding_service import EmbeddingService
from app.services.analysis_service import AnalysisService
from app.services.data_seeder import DataSeederService
from app.services.sentiment_service import SentimentService

router = APIRouter(dependencies=[Depends(verify_api_key)])

# Global service instances (initialized on startup)
embedding_service: Optional[EmbeddingService] = None
analysis_service: Optional[AnalysisService] = None
data_seeder_service: Optional[DataSeederService] = None
sentiment_service: Optional[SentimentService] = None


def initialize_services(
    ollama_base_url: str = "http://localhost:11434",
    embedding_model: str = "bge-m3",
    llm_model: str = "exaone3.5:7.8b",
    db_pool=None,
) -> None:
    """Initialize services and load seed data (idempotent).

    On first run, seeds both mock_logs and seed_logs_expanded.
    On subsequent runs, reuses existing collection data.

    Args:
        ollama_base_url: Ollama server base URL.
        embedding_model: Embedding model name.
        llm_model: LLM model name.
        db_pool: psycopg ConnectionPool for PostgreSQL pgvector.
    """
    global embedding_service, analysis_service, data_seeder_service, sentiment_service

    # Initialize embedding service
    embedding_service = EmbeddingService(
        model_name=embedding_model, ollama_base_url=ollama_base_url, db_pool=db_pool
    )

    # Load all seed data (mock + expanded) and initialize vector store
    mock_logs = embedding_service.load_mock_logs()
    expanded_logs = embedding_service.load_mock_logs(
        mock_logs_path="app/data/seed_logs_expanded.json"
    )

    # Deduplicate by ID
    seen_ids = set()
    all_logs = []
    for log in mock_logs + expanded_logs:
        if log.id not in seen_ids:
            seen_ids.add(log.id)
            all_logs.append(log)

    # Initialize vector store (idempotent - skips if data exists)
    embedding_service.initialize_vectorstore(all_logs)

    # Initialize analysis service
    analysis_service = AnalysisService(
        embedding_service=embedding_service,
        model_name=llm_model,
        ollama_base_url=ollama_base_url,
    )

    # Initialize data seeder service
    data_seeder_service = DataSeederService(embedding_service=embedding_service)

    # Initialize sentiment service
    sentiment_service = SentimentService(
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
        version="1.1.0",
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


@router.post("/api/v1/sentiment", response_model=SentimentResponse)
async def analyze_sentiment(request: SentimentRequest) -> SentimentResponse:
    """Analyze sentiment of VOC text.

    Args:
        request: Sentiment analysis request with text.

    Returns:
        Sentiment classification with confidence and emotions.

    Raises:
        HTTPException: If sentiment service is not initialized.
    """
    if sentiment_service is None:
        raise HTTPException(
            status_code=503,
            detail="Sentiment service not initialized.",
        )

    try:
        result = sentiment_service.analyze(request.text)
        return SentimentResponse(
            sentiment=result["sentiment"],
            confidence=result["confidence"],
            emotions=result["emotions"],
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Sentiment analysis failed: {str(e)}"
        )


# Allowed seed sources to prevent path traversal attacks
ALLOWED_SEED_SOURCES = {"expanded", "templates"}


@router.post("/api/v1/seed", response_model=SeedResponse)
async def seed_data(request: SeedRequest) -> SeedResponse:
    """Seed vector database with log data.

    Args:
        request: Seeding request with source type and options.
            - source: 'expanded' (default seed file) or 'templates' (generate from templates)

    Returns:
        Seeding result with status and statistics.

    Raises:
        HTTPException: If seeding fails or invalid source.
    """
    if data_seeder_service is None:
        raise HTTPException(
            status_code=503,
            detail="Data seeder service not initialized.",
        )

    # Security: Only allow predefined sources
    if request.source not in ALLOWED_SEED_SOURCES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid source: '{request.source}'. Must be one of: {sorted(ALLOWED_SEED_SOURCES)}",
        )

    try:
        if request.source == "expanded":
            # Use predefined seed file only - no arbitrary file paths allowed
            result = data_seeder_service.seed_from_file()
        elif request.source == "templates":
            result = data_seeder_service.seed_from_templates(
                count_per_category=request.count_per_category or 10
            )

        return SeedResponse(
            status=result.status.value,
            total_entries=result.total_entries,
            seeded_entries=result.seeded_entries,
            failed_entries=result.failed_entries,
            categories_seeded=result.categories_seeded,
            started_at=result.started_at,
            completed_at=result.completed_at,
            error_message=result.error_message,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")


@router.post("/api/v1/seed/reset")
async def reset_and_reseed() -> dict:
    """Reset vector store and re-seed from scratch.

    Deletes all existing vector data and re-initializes with seed files.
    Useful for first-time setup or fixing corrupted data.

    Returns:
        Status and document count after re-seeding.
    """
    if embedding_service is None:
        raise HTTPException(status_code=503, detail="Service not initialized.")

    try:
        # 1. Reset (delete all collections)
        embedding_service.reset_vectorstore()

        # 2. Re-seed with all data
        mock_logs = embedding_service.load_mock_logs()
        expanded_logs = embedding_service.load_mock_logs(
            mock_logs_path="app/data/seed_logs_expanded.json"
        )

        seen_ids = set()
        all_logs = []
        for log in mock_logs + expanded_logs:
            if log.id not in seen_ids:
                seen_ids.add(log.id)
                all_logs.append(log)

        embedding_service.initialize_vectorstore(all_logs)

        return {
            "status": "success",
            "message": f"Reset and re-seeded {len(all_logs)} unique documents",
            "collection_count": embedding_service.get_collection_count(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")


@router.get("/api/v1/seed/status", response_model=dict)
async def get_seeding_status() -> dict:
    """Get current seeding status.

    Returns:
        Current seeding status and last result.

    Raises:
        HTTPException: If service not initialized.
    """
    if data_seeder_service is None:
        raise HTTPException(
            status_code=503,
            detail="Data seeder service not initialized.",
        )

    return data_seeder_service.get_seeding_status()


@router.post("/api/v1/learn", response_model=SeedResponse)
async def learn_from_voc(request: LearnRequest) -> SeedResponse:
    """Progressive learning: Add resolved VOC to vector database.

    This endpoint allows the system to learn from resolved VOCs,
    improving future analysis accuracy.

    Args:
        request: Learning request with VOC details and resolution.

    Returns:
        Seeding result for the learned data.

    Raises:
        HTTPException: If learning fails.
    """
    if data_seeder_service is None:
        raise HTTPException(
            status_code=503,
            detail="Data seeder service not initialized.",
        )

    try:
        result = data_seeder_service.seed_from_voc_resolution(
            voc_id=request.voc_id,
            title=request.title,
            content=request.content,
            resolution=request.resolution,
            analysis_result=request.analysis_result or {},
        )

        return SeedResponse(
            status=result.status.value,
            total_entries=result.total_entries,
            seeded_entries=result.seeded_entries,
            failed_entries=result.failed_entries,
            categories_seeded=result.categories_seeded,
            started_at=result.started_at,
            completed_at=result.completed_at,
            error_message=result.error_message,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Progressive learning failed: {str(e)}"
        )
