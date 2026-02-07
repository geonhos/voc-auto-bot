"""Pydantic models for VOC similarity search service."""

from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class VocIndexRequest(BaseModel):
    """Request model for indexing a VOC into the vector database."""

    voc_id: int = Field(..., description="VOC ID", ge=1)
    title: str = Field(..., description="VOC title", min_length=1, max_length=500)
    content: str = Field(..., description="VOC content", min_length=1, max_length=5000)
    category: Optional[str] = Field(None, description="VOC category name")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "voc_id": 1,
                "title": "결제 오류 발생",
                "content": "결제 진행 중 타임아웃 오류가 발생했습니다.",
                "category": "payment",
            }
        }
    )


class SimilarVocSearchRequest(BaseModel):
    """Request model for searching similar VOCs."""

    query_text: str = Field(
        ..., description="Search query text (VOC content)", min_length=1, max_length=5000
    )
    limit: int = Field(
        default=5, description="Maximum number of results to return", ge=1, le=50
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "query_text": "결제 진행 중 타임아웃 오류가 발생했습니다.",
                "limit": 5,
            }
        }
    )


class SimilarVocItem(BaseModel):
    """A single similar VOC result."""

    voc_id: int = Field(..., description="VOC ID")
    similarity: float = Field(
        ..., description="Similarity score (0.0 to 1.0)", ge=0.0, le=1.0
    )
    title: str = Field(..., description="VOC title")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "voc_id": 42,
                "similarity": 0.87,
                "title": "결제 시 타임아웃 에러",
            }
        }
    )


class SimilarVocSearchResponse(BaseModel):
    """Response model for similar VOC search."""

    results: List[SimilarVocItem] = Field(
        default_factory=list, description="List of similar VOC results"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "results": [
                    {
                        "voc_id": 42,
                        "similarity": 0.87,
                        "title": "결제 시 타임아웃 에러",
                    },
                    {
                        "voc_id": 15,
                        "similarity": 0.72,
                        "title": "PG사 연결 오류",
                    },
                ]
            }
        }
    )


class VocIndexResponse(BaseModel):
    """Response model for VOC indexing."""

    status: str = Field(..., description="Indexing status")
    voc_id: int = Field(..., description="Indexed VOC ID")
    message: str = Field(..., description="Status message")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "indexed",
                "voc_id": 1,
                "message": "VOC successfully indexed.",
            }
        }
    )
