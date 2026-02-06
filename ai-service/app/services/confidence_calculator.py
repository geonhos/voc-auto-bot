"""Confidence calculator for analysis results."""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional

# Import enums from schemas to avoid duplication
from app.models.schemas import ConfidenceLevelEnum as ConfidenceLevel
from app.models.schemas import AnalysisMethodEnum as AnalysisMethod


@dataclass
class ConfidenceBreakdown:
    """Breakdown of confidence score components."""

    vector_match_score: float  # 0.0 - 1.0
    similarity_score: float  # 0.0 - 1.0
    response_completeness: float  # 0.0 - 1.0
    category_match_score: float  # 0.0 - 1.0


@dataclass
class ConfidenceDetails:
    """Detailed confidence information."""

    level: ConfidenceLevel
    score: float
    breakdown: ConfidenceBreakdown
    factors: List[str]
    method: AnalysisMethod


class ConfidenceCalculator:
    """Calculator for analysis result confidence scores."""

    # Weights for different factors
    WEIGHTS = {
        "vector_match": 0.35,
        "similarity": 0.25,
        "response_completeness": 0.25,
        "category_match": 0.15,
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
        llm_response_fields: Optional[Dict[str, Any]] = None,
        category_detected: bool = False,
        keyword_match_count: int = 0,
    ) -> ConfidenceDetails:
        """Calculate confidence score and details.

        Args:
            analysis_method: Method used for analysis.
            vector_matches: Number of vector matches found.
            avg_similarity_score: Average similarity score from vector search.
            llm_response_fields: Dict of LLM response fields for completeness check.
            category_detected: Whether a category was detected.
            keyword_match_count: Number of keywords matched.

        Returns:
            ConfidenceDetails with score, level, and breakdown.
        """
        # Calculate individual scores
        vector_match_score = self._calculate_vector_match_score(vector_matches)
        similarity_score = self._normalize_similarity(avg_similarity_score)
        response_completeness = self._calculate_response_completeness(
            llm_response_fields
        )
        category_match_score = self._calculate_category_match_score(
            category_detected, keyword_match_count
        )

        # Apply method-based adjustments
        method_multiplier = self._get_method_multiplier(analysis_method)

        # Create breakdown
        breakdown = ConfidenceBreakdown(
            vector_match_score=vector_match_score,
            similarity_score=similarity_score,
            response_completeness=response_completeness,
            category_match_score=category_match_score,
        )

        # Calculate weighted score
        raw_score = (
            self.WEIGHTS["vector_match"] * vector_match_score
            + self.WEIGHTS["similarity"] * similarity_score
            + self.WEIGHTS["response_completeness"] * response_completeness
            + self.WEIGHTS["category_match"] * category_match_score
        )

        # Apply method multiplier
        final_score = min(1.0, raw_score * method_multiplier)

        # Determine level
        level = self._determine_level(final_score)

        # Generate factors explanation
        factors = self._generate_factors(
            analysis_method, vector_matches, avg_similarity_score, breakdown
        )

        return ConfidenceDetails(
            level=level,
            score=round(final_score, 2),
            breakdown=breakdown,
            factors=factors,
            method=analysis_method,
        )

    def _calculate_vector_match_score(self, vector_matches: int) -> float:
        """Calculate score based on number of vector matches.

        Args:
            vector_matches: Number of similar logs found.

        Returns:
            Score between 0.0 and 1.0.
        """
        if vector_matches >= 5:
            return 1.0
        elif vector_matches >= 3:
            return 0.8
        elif vector_matches >= 2:
            return 0.6
        elif vector_matches >= 1:
            return 0.4
        else:
            return 0.0

    def _normalize_similarity(self, avg_similarity: float) -> float:
        """Normalize similarity score to 0-1 range.

        Args:
            avg_similarity: Average similarity score.

        Returns:
            Normalized score.
        """
        # Handle different scoring systems
        if avg_similarity < 0:
            # ChromaDB can return negative scores; normalize
            return max(0.0, min(1.0, (avg_similarity + 300) / 600))
        elif avg_similarity > 1.0:
            # Some systems return percentage-like scores
            return min(1.0, avg_similarity / 100)
        else:
            return max(0.0, min(1.0, avg_similarity))

    def _calculate_response_completeness(
        self, response_fields: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate completeness of LLM response.

        Args:
            response_fields: Dict of response fields.

        Returns:
            Completeness score between 0.0 and 1.0.
        """
        if not response_fields:
            return 0.5  # Default for missing response

        expected_fields = [
            "summary",
            "confidence",
            "keywords",
            "possibleCauses",
            "recommendation",
        ]

        present_count = 0
        for field in expected_fields:
            value = response_fields.get(field)
            if value is not None:
                # Check for non-empty values
                if isinstance(value, str) and len(value.strip()) > 0:
                    present_count += 1
                elif isinstance(value, list) and len(value) > 0:
                    present_count += 1
                elif isinstance(value, (int, float)):
                    present_count += 1

        return present_count / len(expected_fields)

    def _calculate_category_match_score(
        self, category_detected: bool, keyword_count: int
    ) -> float:
        """Calculate score based on category detection.

        Args:
            category_detected: Whether a category was detected.
            keyword_count: Number of keywords matched.

        Returns:
            Score between 0.0 and 1.0.
        """
        if not category_detected:
            return 0.0

        # More keywords = higher confidence
        if keyword_count >= 5:
            return 1.0
        elif keyword_count >= 3:
            return 0.8
        elif keyword_count >= 2:
            return 0.6
        else:
            return 0.4

    def _get_method_multiplier(self, method: AnalysisMethod) -> float:
        """Get confidence multiplier based on analysis method.

        Args:
            method: Analysis method used.

        Returns:
            Multiplier for final score.
        """
        multipliers = {
            AnalysisMethod.RAG: 1.0,  # Full confidence for RAG
            AnalysisMethod.RULE_BASED: 0.7,  # Reduced for rule-based
            AnalysisMethod.DIRECT_LLM: 0.5,  # Lowest for direct LLM
        }
        return multipliers.get(method, 0.5)

    def _determine_level(self, score: float) -> ConfidenceLevel:
        """Determine confidence level from score.

        Args:
            score: Calculated confidence score.

        Returns:
            Confidence level enum.
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
        breakdown: ConfidenceBreakdown,
    ) -> List[str]:
        """Generate human-readable factors explaining confidence.

        Args:
            method: Analysis method used.
            vector_matches: Number of vector matches.
            avg_similarity: Average similarity score.
            breakdown: Confidence breakdown.

        Returns:
            List of factor descriptions.
        """
        factors = []

        # Method factor
        method_descriptions = {
            AnalysisMethod.RAG: "RAG 기반 분석 (유사 로그 참조)",
            AnalysisMethod.RULE_BASED: "규칙 기반 분석 (키워드 매칭)",
            AnalysisMethod.DIRECT_LLM: "LLM 직접 분석 (참조 데이터 없음)",
        }
        factors.append(method_descriptions.get(method, "알 수 없는 분석 방법"))

        # Vector match factor
        if vector_matches >= 3:
            factors.append(f"충분한 유사 로그 발견 ({vector_matches}개)")
        elif vector_matches > 0:
            factors.append(f"제한된 유사 로그 발견 ({vector_matches}개)")
        else:
            factors.append("유사 로그 없음")

        # Similarity factor
        if avg_similarity >= 0.8:
            factors.append("높은 유사도 점수")
        elif avg_similarity >= 0.5:
            factors.append("중간 유사도 점수")
        elif avg_similarity > 0:
            factors.append("낮은 유사도 점수")

        # Response completeness factor
        if breakdown.response_completeness >= 0.8:
            factors.append("완전한 분석 결과")
        elif breakdown.response_completeness >= 0.5:
            factors.append("부분적 분석 결과")
        else:
            factors.append("불완전한 분석 결과")

        return factors
