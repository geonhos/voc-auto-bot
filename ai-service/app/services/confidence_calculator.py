"""Confidence calculator for AI analysis results."""

from dataclasses import dataclass
from enum import Enum
from typing import List, Optional


class ConfidenceLevel(str, Enum):
    """Confidence level classification."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class AnalysisMethod(str, Enum):
    """Analysis method used."""
    RAG = "rag"
    RULE_BASED = "rule_based"
    DIRECT_LLM = "direct_llm"


@dataclass
class ConfidenceBreakdown:
    """Breakdown of confidence score factors."""
    vector_match_score: float  # 0.0 - 1.0
    vector_match_count_score: float  # 0.0 - 1.0
    llm_response_score: float  # 0.0 - 1.0
    method_weight: float  # 0.0 - 1.0


@dataclass
class ConfidenceDetails:
    """Detailed confidence information."""
    level: ConfidenceLevel
    score: float
    factors: List[str]
    breakdown: ConfidenceBreakdown


class ConfidenceCalculator:
    """Calculator for analysis confidence scores."""

    # Weight configuration for different factors
    WEIGHTS = {
        "vector_match_score": 0.3,      # Average similarity score
        "vector_match_count": 0.3,      # Number of matching vectors
        "llm_response": 0.25,           # LLM response completeness
        "method": 0.15,                 # Analysis method used
    }

    # Method-specific base scores
    METHOD_SCORES = {
        AnalysisMethod.RAG: 1.0,        # RAG gets full method score
        AnalysisMethod.RULE_BASED: 0.5, # Rule-based gets half
        AnalysisMethod.DIRECT_LLM: 0.3, # Direct LLM gets lowest
    }

    # Thresholds for confidence levels
    HIGH_THRESHOLD = 0.7
    MEDIUM_THRESHOLD = 0.4

    def __init__(self):
        """Initialize confidence calculator."""
        pass

    def calculate(
        self,
        analysis_method: AnalysisMethod,
        vector_matches: int = 0,
        avg_similarity_score: float = 0.0,
        llm_response_completeness: float = 1.0,
        max_vector_matches: int = 5,
    ) -> ConfidenceDetails:
        """Calculate confidence score and details.

        Args:
            analysis_method: Method used for analysis (RAG, rule_based, direct_llm)
            vector_matches: Number of vector matches found
            avg_similarity_score: Average similarity score of vector matches (0.0-1.0)
            llm_response_completeness: Completeness score of LLM response (0.0-1.0)
            max_vector_matches: Maximum expected vector matches for normalization

        Returns:
            ConfidenceDetails with score, level, factors, and breakdown
        """
        # Calculate individual factor scores
        vector_match_score = min(1.0, avg_similarity_score)
        vector_match_count_score = min(1.0, vector_matches / max_vector_matches) if max_vector_matches > 0 else 0.0
        llm_response_score = min(1.0, max(0.0, llm_response_completeness))
        method_weight = self.METHOD_SCORES.get(analysis_method, 0.3)

        # Calculate weighted total score
        total_score = (
            self.WEIGHTS["vector_match_score"] * vector_match_score +
            self.WEIGHTS["vector_match_count"] * vector_match_count_score +
            self.WEIGHTS["llm_response"] * llm_response_score +
            self.WEIGHTS["method"] * method_weight
        )

        # Clamp score to [0.0, 1.0]
        total_score = max(0.0, min(1.0, total_score))

        # Determine confidence level
        level = self._determine_level(total_score)

        # Generate factors list
        factors = self._generate_factors(
            analysis_method,
            vector_matches,
            avg_similarity_score,
            llm_response_completeness
        )

        # Create breakdown
        breakdown = ConfidenceBreakdown(
            vector_match_score=round(vector_match_score, 3),
            vector_match_count_score=round(vector_match_count_score, 3),
            llm_response_score=round(llm_response_score, 3),
            method_weight=round(method_weight, 3)
        )

        return ConfidenceDetails(
            level=level,
            score=round(total_score, 3),
            factors=factors,
            breakdown=breakdown
        )

    def _determine_level(self, score: float) -> ConfidenceLevel:
        """Determine confidence level from score.

        Args:
            score: Confidence score (0.0-1.0)

        Returns:
            ConfidenceLevel enum value
        """
        if score >= self.HIGH_THRESHOLD:
            return ConfidenceLevel.HIGH
        elif score >= self.MEDIUM_THRESHOLD:
            return ConfidenceLevel.MEDIUM
        else:
            return ConfidenceLevel.LOW

    def _generate_factors(
        self,
        method: AnalysisMethod,
        vector_matches: int,
        avg_similarity: float,
        llm_completeness: float
    ) -> List[str]:
        """Generate human-readable factors affecting confidence.

        Args:
            method: Analysis method used
            vector_matches: Number of vector matches
            avg_similarity: Average similarity score
            llm_completeness: LLM response completeness

        Returns:
            List of factor descriptions
        """
        factors = []

        # Method factor
        if method == AnalysisMethod.RAG:
            factors.append("RAG 분석 기반 (높은 신뢰도)")
        elif method == AnalysisMethod.RULE_BASED:
            factors.append("규칙 기반 분석 (중간 신뢰도)")
        else:
            factors.append("직접 LLM 분석 (참조 데이터 없음)")

        # Vector match factors
        if vector_matches >= 3:
            factors.append(f"유사 로그 {vector_matches}건 발견 (충분)")
        elif vector_matches >= 1:
            factors.append(f"유사 로그 {vector_matches}건 발견 (제한적)")
        else:
            factors.append("유사 로그 미발견")

        # Similarity score factors
        if avg_similarity >= 0.8:
            factors.append("높은 유사도 점수")
        elif avg_similarity >= 0.5:
            factors.append("중간 유사도 점수")
        elif avg_similarity > 0:
            factors.append("낮은 유사도 점수")

        # LLM response factors
        if llm_completeness >= 0.9:
            factors.append("LLM 응답 완성도 높음")
        elif llm_completeness >= 0.7:
            factors.append("LLM 응답 완성도 양호")
        elif llm_completeness < 0.5:
            factors.append("LLM 응답 불완전")

        return factors

    def calculate_llm_response_completeness(
        self,
        summary: Optional[str],
        possible_causes: Optional[List[str]],
        recommendation: Optional[str],
        keywords: Optional[List[str]]
    ) -> float:
        """Calculate LLM response completeness score.

        Args:
            summary: Analysis summary
            possible_causes: List of possible causes
            recommendation: Recommended actions
            keywords: Keywords extracted

        Returns:
            Completeness score (0.0-1.0)
        """
        score = 0.0

        # Summary (30%)
        if summary and len(summary.strip()) > 20:
            score += 0.3

        # Possible causes (30%)
        if possible_causes and len(possible_causes) >= 2:
            score += 0.3
        elif possible_causes and len(possible_causes) >= 1:
            score += 0.15

        # Recommendation (25%)
        if recommendation and len(recommendation.strip()) > 20:
            score += 0.25

        # Keywords (15%)
        if keywords and len(keywords) >= 3:
            score += 0.15
        elif keywords and len(keywords) >= 1:
            score += 0.075

        return min(1.0, score)
