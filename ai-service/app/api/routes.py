"""API routes for VOC log analysis service."""

from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.models.schemas import AnalysisRequest, AnalysisResponse, HealthResponse
from app.services.embedding_service import EmbeddingService
from app.services.analysis_service import AnalysisService
from app.services.data_seeder import DataSeederService, SeedingStatus

router = APIRouter()

# Global service instances (initialized on startup)
embedding_service: Optional[EmbeddingService] = None
analysis_service: Optional[AnalysisService] = None
data_seeder_service: Optional[DataSeederService] = None


# Seeding request/response models
class SeedRequest(BaseModel):
    """Request model for seeding operation."""
    source: str = Field(
        default="expanded",
        description="Source for seeding: 'expanded' (seed_logs_expanded.json), 'templates' (generate from templates), or custom file path"
    )


class SeedResponse(BaseModel):
    """Response model for seeding operation."""
    status: str = Field(..., description="Seeding status")
    total_entries: int = Field(..., description="Total entries processed")
    seeded_entries: int = Field(..., description="Successfully seeded entries")
    failed_entries: int = Field(..., description="Failed entries")
    categories_covered: list = Field(..., description="Categories covered")
    message: str = Field(..., description="Status message")


class SeedStatusResponse(BaseModel):
    """Response model for seeding status check."""
    status: str = Field(..., description="Current seeding status")
    seeded_entries: int = Field(..., description="Number of seeded entries")
    categories_covered: list = Field(..., description="Categories covered")
    is_seeded: bool = Field(..., description="Whether seeding is complete")


def initialize_services(
    ollama_base_url: str = "http://localhost:11434",
    embedding_model: str = "nomic-embed-text",
    llm_model: str = "gpt-oss:20b",
) -> None:
    """Initialize services and load mock data.

    Args:
        ollama_base_url: Ollama server base URL.
        embedding_model: Embedding model name.
        llm_model: LLM model name.
    """
    global embedding_service, analysis_service, data_seeder_service

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

    # Initialize data seeder service
    data_seeder_service = DataSeederService(embedding_service=embedding_service)


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


@router.post("/api/v1/seed", response_model=SeedResponse)
async def seed_vector_database(request: SeedRequest) -> SeedResponse:
    """Seed the vector database with log data.

    Args:
        request: Seeding request specifying the source.

    Returns:
        Seeding result with status and statistics.

    Raises:
        HTTPException: If services are not initialized or seeding fails.
    """
    if data_seeder_service is None:
        raise HTTPException(
            status_code=503,
            detail="Data seeder service not initialized.",
        )

    try:
        if request.source == "expanded":
            # Use expanded seed logs file
            current_dir = Path(__file__).parent.parent
            seed_file = current_dir / "data" / "seed_logs_expanded.json"
            result = data_seeder_service.seed_from_file(str(seed_file))
        elif request.source == "templates":
            # Generate from templates
            result = data_seeder_service.seed_from_templates()
        else:
            # Assume it's a custom file path
            result = data_seeder_service.seed_from_file(request.source)

        return SeedResponse(
            status=result.status.value,
            total_entries=result.total_entries,
            seeded_entries=result.seeded_entries,
            failed_entries=result.failed_entries,
            categories_covered=result.categories_covered,
            message=f"Seeding {'completed successfully' if result.status == SeedingStatus.COMPLETED else 'failed'}"
            + (f": {result.error_message}" if result.error_message else "")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")


@router.get("/api/v1/seed/status", response_model=SeedStatusResponse)
async def get_seeding_status() -> SeedStatusResponse:
    """Get current seeding status.

    Returns:
        Current seeding status information.

    Raises:
        HTTPException: If services are not initialized.
    """
    if data_seeder_service is None:
        raise HTTPException(
            status_code=503,
            detail="Data seeder service not initialized.",
        )

    status = data_seeder_service.get_seeding_status()

    return SeedStatusResponse(
        status=status["status"],
        seeded_entries=status["seeded_entries"],
        categories_covered=status["categories_covered"],
        is_seeded=data_seeder_service.is_seeded()
    )


class LearnFromVocRequest(BaseModel):
    """Request model for progressive learning from resolved VOC."""
    voc_id: str = Field(..., description="VOC identifier")
    title: str = Field(..., description="VOC title")
    content: str = Field(..., description="VOC content")
    resolution: str = Field(..., description="Resolution applied")
    category: str = Field(..., description="VOC category")


class LearnFromVocResponse(BaseModel):
    """Response model for progressive learning."""
    success: bool = Field(..., description="Whether learning was successful")
    message: str = Field(..., description="Status message")


@router.post("/api/v1/learn", response_model=LearnFromVocResponse)
async def learn_from_resolved_voc(request: LearnFromVocRequest) -> LearnFromVocResponse:
    """Add a resolved VOC to the vector database for progressive learning.

    Args:
        request: Learning request with VOC details and resolution.

    Returns:
        Learning result status.

    Raises:
        HTTPException: If services are not initialized.
    """
    if data_seeder_service is None:
        raise HTTPException(
            status_code=503,
            detail="Data seeder service not initialized.",
        )

    try:
        success = data_seeder_service.seed_from_resolved_voc(
            voc_id=request.voc_id,
            title=request.title,
            content=request.content,
            resolution=request.resolution,
            category=request.category
        )

        return LearnFromVocResponse(
            success=success,
            message="VOC added to vector database for learning" if success else "Failed to add VOC to vector database"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Learning failed: {str(e)}")
