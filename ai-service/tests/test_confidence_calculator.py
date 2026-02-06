"""Unit tests for ConfidenceCalculator service."""

import pytest
from app.services.confidence_calculator import (
    ConfidenceCalculator,
    ConfidenceDetails,
    ConfidenceBreakdown,
    ConfidenceLevel,
    AnalysisMethod,
)


class TestConfidenceCalculator:
    """Tests for ConfidenceCalculator class."""

    @pytest.fixture
    def calculator(self) -> ConfidenceCalculator:
        """Create a ConfidenceCalculator instance."""
        return ConfidenceCalculator()

    def test_calculate_high_confidence_rag(self, calculator: ConfidenceCalculator):
        """Test high confidence calculation with RAG method."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=5,
            avg_similarity_score=0.9,
            llm_response_fields={
                "summary": "Test summary",
                "confidence": 0.9,
                "keywords": ["test"],
                "possibleCauses": ["cause1"],
                "recommendation": "Do something",
            },
            category_detected=True,
            keyword_match_count=5,
        )

        assert isinstance(result, ConfidenceDetails)
        assert result.level == ConfidenceLevel.HIGH
        assert result.score >= 0.7
        assert result.method == AnalysisMethod.RAG
        assert len(result.factors) > 0

    def test_calculate_medium_confidence_rule_based(
        self, calculator: ConfidenceCalculator
    ):
        """Test medium confidence calculation with rule-based method."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RULE_BASED,
            vector_matches=2,
            avg_similarity_score=0.5,
            llm_response_fields={
                "summary": "Test summary",
                "confidence": 0.5,
            },
            category_detected=True,
            keyword_match_count=2,
        )

        assert isinstance(result, ConfidenceDetails)
        assert result.method == AnalysisMethod.RULE_BASED
        # Rule-based has 0.7 multiplier, so score is reduced
        assert result.score <= 0.7

    def test_calculate_low_confidence_direct_llm(
        self, calculator: ConfidenceCalculator
    ):
        """Test low confidence calculation with direct LLM method."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.DIRECT_LLM,
            vector_matches=0,
            avg_similarity_score=0.0,
            llm_response_fields=None,
            category_detected=False,
            keyword_match_count=0,
        )

        assert isinstance(result, ConfidenceDetails)
        assert result.level == ConfidenceLevel.LOW
        assert result.method == AnalysisMethod.DIRECT_LLM
        assert result.score < 0.4

    def test_vector_match_score_calculation(self, calculator: ConfidenceCalculator):
        """Test vector match score calculation for different match counts."""
        # 5+ matches = 1.0
        assert calculator._calculate_vector_match_score(5) == 1.0
        assert calculator._calculate_vector_match_score(10) == 1.0

        # 3-4 matches = 0.8
        assert calculator._calculate_vector_match_score(3) == 0.8
        assert calculator._calculate_vector_match_score(4) == 0.8

        # 2 matches = 0.6
        assert calculator._calculate_vector_match_score(2) == 0.6

        # 1 match = 0.4
        assert calculator._calculate_vector_match_score(1) == 0.4

        # 0 matches = 0.0
        assert calculator._calculate_vector_match_score(0) == 0.0

    def test_normalize_similarity_score(self, calculator: ConfidenceCalculator):
        """Test similarity score normalization."""
        # Normal range
        assert calculator._normalize_similarity(0.5) == 0.5
        assert calculator._normalize_similarity(1.0) == 1.0
        assert calculator._normalize_similarity(0.0) == 0.0

        # Clamping
        assert calculator._normalize_similarity(1.5) <= 1.0
        assert calculator._normalize_similarity(-0.5) >= 0.0

    def test_response_completeness_calculation(self, calculator: ConfidenceCalculator):
        """Test response completeness calculation."""
        # Full response
        full_response = {
            "summary": "Test",
            "confidence": 0.9,
            "keywords": ["k1"],
            "possibleCauses": ["c1"],
            "recommendation": "Do this",
        }
        assert calculator._calculate_response_completeness(full_response) == 1.0

        # Partial response
        partial_response = {
            "summary": "Test",
            "confidence": 0.9,
        }
        completeness = calculator._calculate_response_completeness(partial_response)
        assert 0.0 < completeness < 1.0

        # Empty/None response returns default 0.5
        assert calculator._calculate_response_completeness(None) == 0.5
        assert calculator._calculate_response_completeness({}) == 0.5

    def test_category_match_score_calculation(self, calculator: ConfidenceCalculator):
        """Test category match score calculation."""
        # No category detected
        assert calculator._calculate_category_match_score(False, 0) == 0.0

        # Category detected with different keyword counts
        assert calculator._calculate_category_match_score(True, 5) == 1.0
        assert calculator._calculate_category_match_score(True, 3) == 0.8
        assert calculator._calculate_category_match_score(True, 2) == 0.6
        assert calculator._calculate_category_match_score(True, 1) == 0.4

    def test_method_multiplier(self, calculator: ConfidenceCalculator):
        """Test analysis method multipliers."""
        assert calculator._get_method_multiplier(AnalysisMethod.RAG) == 1.0
        assert calculator._get_method_multiplier(AnalysisMethod.RULE_BASED) == 0.7
        assert calculator._get_method_multiplier(AnalysisMethod.DIRECT_LLM) == 0.5

    def test_determine_level_thresholds(self, calculator: ConfidenceCalculator):
        """Test confidence level determination from score."""
        # HIGH: >= 0.7
        assert calculator._determine_level(0.7) == ConfidenceLevel.HIGH
        assert calculator._determine_level(0.9) == ConfidenceLevel.HIGH
        assert calculator._determine_level(1.0) == ConfidenceLevel.HIGH

        # MEDIUM: >= 0.4 and < 0.7
        assert calculator._determine_level(0.4) == ConfidenceLevel.MEDIUM
        assert calculator._determine_level(0.5) == ConfidenceLevel.MEDIUM
        assert calculator._determine_level(0.69) == ConfidenceLevel.MEDIUM

        # LOW: < 0.4
        assert calculator._determine_level(0.0) == ConfidenceLevel.LOW
        assert calculator._determine_level(0.3) == ConfidenceLevel.LOW
        assert calculator._determine_level(0.39) == ConfidenceLevel.LOW

    def test_factors_generation(self, calculator: ConfidenceCalculator):
        """Test human-readable factors generation."""
        breakdown = ConfidenceBreakdown(
            vector_match_score=0.8,
            similarity_score=0.7,
            response_completeness=0.9,
            category_match_score=0.6,
        )

        factors = calculator._generate_factors(
            method=AnalysisMethod.RAG,
            vector_matches=5,
            avg_similarity=0.8,
            breakdown=breakdown,
        )

        assert len(factors) > 0
        assert any("RAG" in f for f in factors)
        assert any("유사 로그" in f for f in factors)

    def test_breakdown_structure(self, calculator: ConfidenceCalculator):
        """Test that breakdown structure is correctly created."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=3,
            avg_similarity_score=0.75,
            category_detected=True,
            keyword_match_count=3,
        )

        breakdown = result.breakdown
        assert isinstance(breakdown, ConfidenceBreakdown)
        assert 0.0 <= breakdown.vector_match_score <= 1.0
        assert 0.0 <= breakdown.similarity_score <= 1.0
        assert 0.0 <= breakdown.response_completeness <= 1.0
        assert 0.0 <= breakdown.category_match_score <= 1.0
