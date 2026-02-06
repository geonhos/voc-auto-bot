"""Pydantic models for VOC log analysis service."""

from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class ConfidenceLevelEnum(str, Enum):
    """Confidence level classification."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AnalysisMethodEnum(str, Enum):
    """Analysis method used for generating results."""

    RAG = "rag"
    RULE_BASED = "rule_based"
    DIRECT_LLM = "direct_llm"


class ConfidenceBreakdownSchema(BaseModel):
    """Breakdown of confidence score components."""

    vectorMatchScore: float = Field(
        ..., description="Score based on number of vector matches", ge=0.0, le=1.0
    )
    similarityScore: float = Field(
        ..., description="Average similarity score from vector search", ge=0.0, le=1.0
    )
    responseCompleteness: float = Field(
        ..., description="Completeness of LLM response", ge=0.0, le=1.0
    )
    categoryMatchScore: float = Field(
        ..., description="Score based on category detection", ge=0.0, le=1.0
    )


class ConfidenceDetails(BaseModel):
    """Detailed confidence information."""

    level: ConfidenceLevelEnum = Field(..., description="Confidence level classification")
    score: float = Field(..., description="Overall confidence score", ge=0.0, le=1.0)
    breakdown: Optional[ConfidenceBreakdownSchema] = Field(
        None, description="Breakdown of confidence components"
    )
    factors: List[str] = Field(
        default_factory=list, description="Factors affecting confidence"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "level": "HIGH",
                "score": 0.85,
                "breakdown": {
                    "vectorMatchScore": 0.9,
                    "similarityScore": 0.8,
                    "responseCompleteness": 0.85,
                    "categoryMatchScore": 0.9,
                },
                "factors": [
                    "RAG 기반 분석 (유사 로그 참조)",
                    "충분한 유사 로그 발견 (5개)",
                    "높은 유사도 점수",
                ],
            }
        }
    )


class AnalysisRequest(BaseModel):
    """Request model for VOC log analysis."""

    title: str = Field(..., description="VOC title", min_length=1, max_length=500)
    content: str = Field(..., description="VOC content", min_length=1, max_length=5000)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "결제 오류 발생",
                "content": "결제 진행 중 타임아웃 오류가 발생했습니다. 30초 후 연결 실패 메시지가 표시됩니다.",
            }
        }
    )


class RelatedLog(BaseModel):
    """Related log entry with relevance score."""

    timestamp: str = Field(..., description="Log timestamp")
    logLevel: str = Field(..., description="Log level (ERROR, WARN, INFO, etc.)")
    serviceName: str = Field(..., description="Service name that generated the log")
    message: str = Field(..., description="Log message")
    relevanceScore: float = Field(
        ..., description="Relevance score to VOC (0.0 to 1.0)", ge=0.0, le=1.0
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "timestamp": "2026-01-28T10:15:23.456Z",
                "logLevel": "ERROR",
                "serviceName": "payment-service",
                "message": "Payment gateway timeout: Connection to PG server failed",
                "relevanceScore": 0.95,
            }
        }
    )


class AnalysisResponse(BaseModel):
    """Response model for VOC log analysis."""

    summary: str = Field(..., description="Brief analysis summary")
    confidence: float = Field(
        ..., description="Confidence level of analysis (0.0 to 1.0)", ge=0.0, le=1.0
    )
    keywords: List[str] = Field(..., description="Key keywords from logs")
    possibleCauses: List[str] = Field(..., description="Possible root causes")
    relatedLogs: List[RelatedLog] = Field(..., description="Related log entries")
    recommendation: str = Field(..., description="Recommended actions")

    # New optional fields for enhanced analysis
    analysisMethod: Optional[AnalysisMethodEnum] = Field(
        None, description="Method used for analysis (rag, rule_based, direct_llm)"
    )
    confidenceDetails: Optional[ConfidenceDetails] = Field(
        None, description="Detailed confidence information"
    )
    vectorMatchCount: Optional[int] = Field(
        None, description="Number of vector matches found", ge=0
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "summary": "결제 게이트웨이 연결 타임아웃으로 인한 결제 실패가 발생했습니다.",
                "confidence": 0.92,
                "keywords": ["payment", "timeout", "gateway", "connection"],
                "possibleCauses": [
                    "결제 게이트웨이 서버 응답 지연",
                    "네트워크 연결 불안정",
                    "타임아웃 설정 값 부족",
                ],
                "relatedLogs": [
                    {
                        "timestamp": "2026-01-28T10:15:23.456Z",
                        "logLevel": "ERROR",
                        "serviceName": "payment-service",
                        "message": "Payment gateway timeout",
                        "relevanceScore": 0.95,
                    }
                ],
                "recommendation": "결제 게이트웨이 서버 상태 확인 및 네트워크 연결 점검이 필요합니다.",
                "analysisMethod": "rag",
                "confidenceDetails": {
                    "level": "HIGH",
                    "score": 0.92,
                    "breakdown": {
                        "vectorMatchScore": 1.0,
                        "similarityScore": 0.9,
                        "responseCompleteness": 0.9,
                        "categoryMatchScore": 0.8,
                    },
                    "factors": [
                        "RAG 기반 분석 (유사 로그 참조)",
                        "충분한 유사 로그 발견 (5개)",
                    ],
                },
                "vectorMatchCount": 5,
            }
        }
    )


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Service version")
    vectorstore_initialized: bool = Field(
        ..., description="Whether vector store is initialized"
    )


class LogDocument(BaseModel):
    """Internal model for log document with metadata."""

    id: str
    timestamp: str
    logLevel: str
    serviceName: str
    message: str
    stackTrace: Optional[str] = None
    category: str
    severity: str

    def to_text(self) -> str:
        """Convert log to searchable text format."""
        parts = [
            f"[{self.timestamp}]",
            f"[{self.logLevel}]",
            f"[{self.serviceName}]",
            self.message,
        ]
        if self.stackTrace:
            parts.append(f"StackTrace: {self.stackTrace}")
        return " ".join(parts)

    def to_metadata(self) -> dict:
        """Convert to metadata dict for vector store."""
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "logLevel": self.logLevel,
            "serviceName": self.serviceName,
            "message": self.message,
            "category": self.category,
            "severity": self.severity,
        }


class SeedRequest(BaseModel):
    """Request model for data seeding."""

    source: str = Field(
        default="expanded",
        description="Source type: 'expanded' (predefined seed file) or 'templates' (generate from templates)",
    )
    count_per_category: Optional[int] = Field(
        10, description="Entries per category (for source='templates')", ge=1, le=100
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "source": "expanded",
            }
        }
    )


class SeedResponse(BaseModel):
    """Response model for data seeding."""

    status: str = Field(..., description="Seeding status")
    total_entries: int = Field(..., description="Total entries to seed", ge=0)
    seeded_entries: int = Field(..., description="Successfully seeded entries", ge=0)
    failed_entries: int = Field(..., description="Failed entries", ge=0)
    categories_seeded: List[str] = Field(
        default_factory=list, description="Categories that were seeded"
    )
    started_at: Optional[str] = Field(None, description="Start timestamp")
    completed_at: Optional[str] = Field(None, description="Completion timestamp")
    error_message: Optional[str] = Field(None, description="Error message if failed")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "completed",
                "total_entries": 100,
                "seeded_entries": 100,
                "failed_entries": 0,
                "categories_seeded": [
                    "payment",
                    "auth",
                    "database",
                    "api",
                    "cache",
                ],
                "started_at": "2026-01-28T10:00:00.000Z",
                "completed_at": "2026-01-28T10:00:05.000Z",
            }
        }
    )


class LearnRequest(BaseModel):
    """Request model for progressive learning from resolved VOC."""

    voc_id: str = Field(..., description="VOC identifier")
    title: str = Field(..., description="VOC title")
    content: str = Field(..., description="VOC content")
    resolution: str = Field(..., description="How the VOC was resolved")
    analysis_result: Optional[dict] = Field(
        None, description="Original AI analysis result"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "voc_id": "VOC-2026-001",
                "title": "결제 타임아웃 오류",
                "content": "결제 진행 중 30초 후 타임아웃 발생",
                "resolution": "PG사 서버 장애로 인한 문제. PG사 복구 후 정상화됨.",
                "analysis_result": {
                    "summary": "결제 게이트웨이 타임아웃 문제",
                    "confidence": 0.85,
                },
            }
        }
    )
