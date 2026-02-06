"""API routes for VOC similarity search service."""

from typing import Optional

from fastapi import APIRouter, HTTPException

from app.models.voc_schemas import (
    SimilarVocItem,
    SimilarVocSearchRequest,
    SimilarVocSearchResponse,
    VocIndexRequest,
    VocIndexResponse,
)
from app.services.voc_embedding_service import VocEmbeddingService

voc_router = APIRouter()

# Global VOC embedding service instance (initialized on startup)
voc_embedding_service: Optional[VocEmbeddingService] = None


def initialize_voc_embedding_service(
    ollama_base_url: str = "http://localhost:11434",
    embedding_model: str = "nomic-embed-text",
    persist_directory: str = "./chroma_db",
) -> None:
    """Initialize VOC embedding service.

    Args:
        ollama_base_url: Ollama server base URL.
        embedding_model: Embedding model name.
        persist_directory: ChromaDB persist directory.
    """
    global voc_embedding_service

    voc_embedding_service = VocEmbeddingService(
        model_name=embedding_model,
        ollama_base_url=ollama_base_url,
        persist_directory=persist_directory,
    )


@voc_router.post("/api/v1/similar", response_model=SimilarVocSearchResponse)
async def search_similar_vocs(
    request: SimilarVocSearchRequest,
) -> SimilarVocSearchResponse:
    """Search for VOCs similar to the given query text.

    Args:
        request: Search request with query text and limit.

    Returns:
        List of similar VOC results with similarity scores.

    Raises:
        HTTPException: If the service is not initialized or search fails.
    """
    if voc_embedding_service is None:
        raise HTTPException(
            status_code=503,
            detail="VOC embedding service not initialized. Please check Ollama server is running.",
        )

    try:
        results = voc_embedding_service.search_similar(
            query_text=request.query_text,
            limit=request.limit,
        )

        items = [
            SimilarVocItem(
                voc_id=r["voc_id"],
                similarity=r["similarity"],
                title=r["title"],
            )
            for r in results
        ]

        return SimilarVocSearchResponse(results=items)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Similar VOC search failed: {str(e)}",
        )


@voc_router.post("/api/v1/voc/index", response_model=VocIndexResponse)
async def index_voc(request: VocIndexRequest) -> VocIndexResponse:
    """Index a VOC into the vector database for similarity search.

    Args:
        request: VOC indexing request with VOC details.

    Returns:
        Indexing result with status.

    Raises:
        HTTPException: If the service is not initialized or indexing fails.
    """
    if voc_embedding_service is None:
        raise HTTPException(
            status_code=503,
            detail="VOC embedding service not initialized. Please check Ollama server is running.",
        )

    try:
        voc_embedding_service.index_voc(
            voc_id=request.voc_id,
            title=request.title,
            content=request.content,
            category=request.category,
        )

        return VocIndexResponse(
            status="indexed",
            voc_id=request.voc_id,
            message=f"VOC {request.voc_id} successfully indexed.",
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"VOC indexing failed: {str(e)}",
        )
