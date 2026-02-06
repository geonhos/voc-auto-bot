"""Tests for fallback analyzer components."""

import pytest
from app.services.rule_based_analyzer import RuleBasedAnalyzer, RuleBasedAnalysisResult
from app.services.confidence_calculator import (
    ConfidenceCalculator,
    ConfidenceDetails,
    ConfidenceLevel,
    AnalysisMethod,
)
from app.data.log_templates import (
    LOG_TEMPLATES,
    find_matching_categories,
    get_severity_from_keywords,
)


class TestRuleBasedAnalyzer:
    """Test cases for RuleBasedAnalyzer."""

    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance."""
        return RuleBasedAnalyzer()

    def test_analyze_payment_issue(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of payment-related VOC."""
        result = analyzer.analyze(
            title="결제 오류 발생",
            content="결제 진행 중 타임아웃이 발생했습니다. PG 게이트웨이 연결 실패 메시지가 표시됩니다.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "payment"
        assert result.confidence >= 0.3
        assert result.confidence <= 0.5
        assert len(result.possible_causes) > 0
        assert len(result.keywords) > 0
        assert "결제" in result.summary or "payment" in result.summary.lower()

    def test_analyze_auth_issue(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of authentication-related VOC."""
        result = analyzer.analyze(
            title="로그인 실패",
            content="JWT 토큰이 만료되어 세션이 종료되었습니다. 다시 로그인해야 합니다.",
        )

        assert result.detected_category == "auth"
        assert result.confidence >= 0.3
        assert "인증" in result.summary or "로그인" in result.summary

    def test_analyze_database_issue(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of database-related VOC."""
        result = analyzer.analyze(
            title="DB 연결 오류",
            content="데이터베이스 커넥션 풀이 고갈되어 쿼리 실행이 타임아웃됩니다.",
        )

        assert result.detected_category == "database"
        assert len(result.possible_causes) > 0

    def test_analyze_no_match(self, analyzer: RuleBasedAnalyzer):
        """Test analysis when no category matches."""
        result = analyzer.analyze(
            title="알 수 없는 문제",
            content="정확한 원인을 모르겠습니다. 그냥 안됩니다.",
        )

        # Should return result with no category detected
        assert result.detected_category is None or result.match_count == 0
        assert result.confidence == analyzer.MIN_CONFIDENCE

    def test_can_analyze_with_matching_keywords(self, analyzer: RuleBasedAnalyzer):
        """Test can_analyze returns true for VOCs with matching keywords."""
        assert analyzer.can_analyze("결제 타임아웃", "PG gateway 연결 실패") is True
        assert analyzer.can_analyze("로그인 실패", "JWT token 만료") is True
        assert analyzer.can_analyze("DB 연결 오류", "connection pool exhausted") is True

    def test_can_analyze_without_matching_keywords(self, analyzer: RuleBasedAnalyzer):
        """Test can_analyze returns false for VOCs without matching keywords."""
        assert analyzer.can_analyze("일반 문의", "다른 질문이 있습니다") is False

    def test_get_supported_categories(self, analyzer: RuleBasedAnalyzer):
        """Test getting supported categories."""
        categories = analyzer.get_supported_categories()

        assert len(categories) >= 10
        assert "payment" in categories
        assert "auth" in categories
        assert "database" in categories
        assert "api" in categories
        assert "cache" in categories

    def test_confidence_in_valid_range(self, analyzer: RuleBasedAnalyzer):
        """Test that confidence is always in valid range."""
        test_cases = [
            ("결제 오류", "gateway timeout"),
            ("인증 실패", "token expired jwt session"),
            ("DB 문제", "connection pool deadlock query"),
        ]

        for title, content in test_cases:
            result = analyzer.analyze(title, content)
            assert 0.3 <= result.confidence <= 0.5


class TestConfidenceCalculator:
    """Test cases for ConfidenceCalculator."""

    @pytest.fixture
    def calculator(self):
        """Create calculator instance."""
        return ConfidenceCalculator()

    def test_calculate_rag_high_confidence(self, calculator: ConfidenceCalculator):
        """Test high confidence calculation for RAG with many matches."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=5,
            avg_similarity_score=0.85,
            llm_response_fields={
                "summary": "분석 결과 요약",
                "confidence": 0.9,
                "keywords": ["payment", "timeout"],
                "possibleCauses": ["원인 1", "원인 2"],
                "recommendation": "권장 조치",
            },
            category_detected=True,
            keyword_match_count=5,
        )

        assert isinstance(result, ConfidenceDetails)
        assert result.level == ConfidenceLevel.HIGH
        assert result.score >= 0.7
        assert result.method == AnalysisMethod.RAG
        assert len(result.factors) > 0

    def test_calculate_rag_medium_confidence(self, calculator: ConfidenceCalculator):
        """Test medium confidence calculation for RAG with fewer matches."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=2,
            avg_similarity_score=0.5,
            llm_response_fields={
                "summary": "분석 결과",
                "confidence": 0.6,
                "keywords": ["error"],
                "possibleCauses": ["원인"],
                "recommendation": "조치",
            },
            category_detected=True,
            keyword_match_count=2,
        )

        assert result.level in [ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH]
        assert 0.4 <= result.score <= 0.8

    def test_calculate_rule_based_confidence(self, calculator: ConfidenceCalculator):
        """Test confidence calculation for rule-based analysis."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RULE_BASED,
            vector_matches=0,
            avg_similarity_score=0.0,
            llm_response_fields={
                "summary": "규칙 기반 분석",
                "confidence": 0.4,
                "keywords": ["payment"],
                "possibleCauses": ["원인"],
                "recommendation": "조치",
            },
            category_detected=True,
            keyword_match_count=3,
        )

        # Rule-based should have lower confidence due to method multiplier
        assert result.method == AnalysisMethod.RULE_BASED
        assert result.score < 0.7  # Should not be HIGH due to multiplier

    def test_calculate_direct_llm_low_confidence(self, calculator: ConfidenceCalculator):
        """Test low confidence calculation for direct LLM analysis."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.DIRECT_LLM,
            vector_matches=0,
            avg_similarity_score=0.0,
            llm_response_fields={
                "summary": "직접 분석",
                "confidence": 0.3,
                "keywords": [],
                "possibleCauses": ["가능한 원인"],
                "recommendation": "확인 필요",
            },
            category_detected=False,
            keyword_match_count=0,
        )

        # Direct LLM should have lowest confidence
        assert result.method == AnalysisMethod.DIRECT_LLM
        assert result.level == ConfidenceLevel.LOW
        assert result.score < 0.4

    def test_calculate_no_response_fields(self, calculator: ConfidenceCalculator):
        """Test calculation with missing response fields."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=3,
            avg_similarity_score=0.7,
            llm_response_fields=None,
            category_detected=True,
            keyword_match_count=2,
        )

        # Should still work with default completeness score
        assert result.score > 0

    def test_confidence_levels_thresholds(self, calculator: ConfidenceCalculator):
        """Test confidence level thresholds."""
        # Test HIGH threshold
        high_result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=5,
            avg_similarity_score=0.9,
            llm_response_fields={
                "summary": "s", "confidence": 1, "keywords": ["k"],
                "possibleCauses": ["c"], "recommendation": "r"
            },
            category_detected=True,
            keyword_match_count=5,
        )
        assert high_result.level == ConfidenceLevel.HIGH

        # Test LOW threshold
        low_result = calculator.calculate(
            analysis_method=AnalysisMethod.DIRECT_LLM,
            vector_matches=0,
            avg_similarity_score=0.0,
            llm_response_fields=None,
            category_detected=False,
            keyword_match_count=0,
        )
        assert low_result.level == ConfidenceLevel.LOW

    def test_breakdown_values_in_range(self, calculator: ConfidenceCalculator):
        """Test that breakdown values are in valid 0-1 range."""
        result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=3,
            avg_similarity_score=0.75,
            llm_response_fields={
                "summary": "테스트",
                "confidence": 0.8,
                "keywords": ["a", "b"],
                "possibleCauses": ["c"],
                "recommendation": "d",
            },
            category_detected=True,
            keyword_match_count=3,
        )

        breakdown = result.breakdown
        assert 0.0 <= breakdown.vector_match_score <= 1.0
        assert 0.0 <= breakdown.similarity_score <= 1.0
        assert 0.0 <= breakdown.response_completeness <= 1.0
        assert 0.0 <= breakdown.category_match_score <= 1.0


class TestLogTemplates:
    """Test cases for log templates module."""

    def test_find_matching_categories_payment(self):
        """Test category matching for payment keywords."""
        matches = find_matching_categories("결제 gateway timeout 발생")

        assert len(matches) > 0
        # Payment should be among the top matches
        categories = [m[0] for m in matches]
        assert "payment" in categories

    def test_find_matching_categories_multiple(self):
        """Test category matching with keywords from multiple categories."""
        matches = find_matching_categories("database connection timeout cache miss")

        # Should match multiple categories
        assert len(matches) >= 2
        categories = [m[0] for m in matches]
        assert "database" in categories
        assert "cache" in categories

    def test_find_matching_categories_no_match(self):
        """Test category matching with no matching keywords."""
        matches = find_matching_categories("일반적인 문의입니다")

        # No specific category matches
        assert len(matches) == 0

    def test_get_severity_from_keywords(self):
        """Test severity detection from keywords."""
        # Critical severity
        assert get_severity_from_keywords("deadlock detected in database", "database") == "critical"

        # High severity
        assert get_severity_from_keywords("connection timeout", "database") == "high"

        # Medium severity
        assert get_severity_from_keywords("slow query detected", "database") == "medium"

        # Low severity (no matching severity keywords)
        assert get_severity_from_keywords("info log message", "database") == "low"

    def test_log_templates_structure(self):
        """Test that all templates have required structure."""
        required_keys = ["common_keywords", "typical_causes", "recommended_actions"]

        for category, template in LOG_TEMPLATES.items():
            for key in required_keys:
                assert key in template, f"{category} missing {key}"
                assert isinstance(template[key], list), f"{category}.{key} should be a list"
                assert len(template[key]) > 0, f"{category}.{key} should not be empty"


class TestFallbackChainBehavior:
    """Integration tests for fallback chain behavior."""

    @pytest.fixture
    def analyzer(self):
        """Create analyzer instance."""
        return RuleBasedAnalyzer()

    @pytest.fixture
    def calculator(self):
        """Create calculator instance."""
        return ConfidenceCalculator()

    def test_fallback_chain_no_vector_matches(self, analyzer, calculator):
        """Test behavior when vector matching fails."""
        # Simulate scenario where vector DB returns no matches
        # Rule-based analyzer should handle this

        if analyzer.can_analyze("결제 타임아웃", "PG 연결 실패"):
            result = analyzer.analyze("결제 타임아웃", "PG 연결 실패")

            assert result.confidence >= 0.3
            assert result.detected_category is not None

    def test_confidence_degradation_through_chain(self, calculator):
        """Test that confidence degrades from RAG to Rule-Based to Direct LLM."""
        base_params = {
            "vector_matches": 0,
            "avg_similarity_score": 0.0,
            "llm_response_fields": {
                "summary": "test", "confidence": 0.5,
                "keywords": ["k"], "possibleCauses": ["c"],
                "recommendation": "r"
            },
            "category_detected": True,
            "keyword_match_count": 2,
        }

        # RAG should have highest confidence
        rag_result = calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=3,  # Override for RAG
            avg_similarity_score=0.7,  # Override for RAG
            **{k: v for k, v in base_params.items() if k not in ["vector_matches", "avg_similarity_score"]}
        )

        # Rule-based should be lower
        rule_result = calculator.calculate(
            analysis_method=AnalysisMethod.RULE_BASED,
            **base_params
        )

        # Direct LLM should be lowest
        direct_result = calculator.calculate(
            analysis_method=AnalysisMethod.DIRECT_LLM,
            category_detected=False,
            keyword_match_count=0,
            **{k: v for k, v in base_params.items() if k not in ["category_detected", "keyword_match_count"]}
        )

        assert rag_result.score > rule_result.score
        assert rule_result.score > direct_result.score
