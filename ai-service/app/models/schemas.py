"""Pydantic models for VOC log analysis service."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ConfidenceLevel(str, Enum):
    """Confidence level classification."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AnalysisMethod(str, Enum):
    """Analysis method used for generating the response."""
    RAG = "rag"
    RULE_BASED = "rule_based"
    DIRECT_LLM = "direct_llm"


class ConfidenceBreakdown(BaseModel):
    """Breakdown of confidence score factors."""
    vectorMatchScore: float = Field(
        ..., description="Score from vector similarity (0.0-1.0)", ge=0.0, le=1.0
    )
    vectorMatchCountScore: float = Field(
        ..., description="Score from number of vector matches (0.0-1.0)", ge=0.0, le=1.0
    )
    llmResponseScore: float = Field(
        ..., description="Score from LLM response completeness (0.0-1.0)", ge=0.0, le=1.0
    )
    methodWeight: float = Field(
        ..., description="Weight based on analysis method (0.0-1.0)", ge=0.0, le=1.0
    )


class ConfidenceDetails(BaseModel):
    """Detailed confidence information for analysis transparency."""
    level: ConfidenceLevel = Field(..., description="Confidence level (HIGH, MEDIUM, LOW)")
    factors: List[str] = Field(..., description="Human-readable factors affecting confidence")
    breakdown: Optional[ConfidenceBreakdown] = Field(
        None, description="Detailed breakdown of confidence calculation"
    )


class AnalysisRequest(BaseModel):
    """Request model for VOC log analysis."""

    title: str = Field(..., description="VOC title", min_length=1, max_length=500)
    content: str = Field(..., description="VOC content", min_length=1, max_length=5000)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "결제 오류 발생",
                "content": "결제 진행 중 타임아웃 오류가 발생했습니다. 30초 후 연결 실패 메시지가 표시됩니다.",
            }
        }


class RelatedLog(BaseModel):
    """Related log entry with relevance score."""

    timestamp: str = Field(..., description="Log timestamp")
    logLevel: str = Field(..., description="Log level (ERROR, WARN, INFO, etc.)")
    serviceName: str = Field(..., description="Service name that generated the log")
    message: str = Field(..., description="Log message")
    relevanceScore: float = Field(
        ..., description="Relevance score to VOC (0.0 to 1.0)", ge=0.0, le=1.0
    )

    class Config:
        json_schema_extra = {
            "example": {
                "timestamp": "2026-01-28T10:15:23.456Z",
                "logLevel": "ERROR",
                "serviceName": "payment-service",
                "message": "Payment gateway timeout: Connection to PG server failed",
                "relevanceScore": 0.95,
            }
        }


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

    # New fields for enhanced confidence reporting (Optional for backward compatibility)
    analysisMethod: Optional[AnalysisMethod] = Field(
        None, description="Method used for analysis (rag, rule_based, direct_llm)"
    )
    confidenceLevel: Optional[ConfidenceLevel] = Field(
        None, description="Confidence level classification (HIGH, MEDIUM, LOW)"
    )
    confidenceDetails: Optional[ConfidenceDetails] = Field(
        None, description="Detailed confidence information"
    )
    vectorMatchCount: Optional[int] = Field(
        None, description="Number of vector matches found", ge=0
    )

    class Config:
        json_schema_extra = {
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
                "confidenceLevel": "HIGH",
                "confidenceDetails": {
                    "level": "HIGH",
                    "factors": ["RAG 분석 기반 (높은 신뢰도)", "유사 로그 5건 발견 (충분)"],
                    "breakdown": {
                        "vectorMatchScore": 0.85,
                        "vectorMatchCountScore": 1.0,
                        "llmResponseScore": 0.9,
                        "methodWeight": 1.0
                    }
                },
                "vectorMatchCount": 5
            }
        }


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
