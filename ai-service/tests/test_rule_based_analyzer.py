"""Unit tests for RuleBasedAnalyzer service."""

import pytest
from app.services.rule_based_analyzer import (
    RuleBasedAnalyzer,
    RuleBasedAnalysisResult,
)


class TestRuleBasedAnalyzer:
    """Tests for RuleBasedAnalyzer class."""

    @pytest.fixture
    def analyzer(self) -> RuleBasedAnalyzer:
        """Create a RuleBasedAnalyzer instance."""
        return RuleBasedAnalyzer()

    def test_analyze_payment_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of payment-related VOC."""
        result = analyzer.analyze(
            title="결제 오류 발생",
            content="결제 진행 중 타임아웃 오류가 발생했습니다. PG 연동 실패.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "payment"
        assert result.match_count > 0
        assert RuleBasedAnalyzer.MIN_CONFIDENCE <= result.confidence
        assert result.confidence <= RuleBasedAnalyzer.MAX_CONFIDENCE
        assert len(result.possible_causes) > 0
        assert "결제" in result.summary

    def test_analyze_auth_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of authentication-related VOC."""
        result = analyzer.analyze(
            title="Login failure",
            content="JWT token expired. OAuth authentication failed. Session invalid.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "auth"
        assert result.match_count > 0
        assert len(result.keywords) > 0

    def test_analyze_database_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of database-related VOC."""
        result = analyzer.analyze(
            title="데이터 조회 오류",
            content="데이터베이스 연결이 실패했습니다. Connection pool exhausted.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "database"
        assert "데이터베이스" in result.summary

    def test_analyze_api_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of API-related VOC."""
        result = analyzer.analyze(
            title="API call failure",
            content="503 error from upstream. Circuit breaker activated. Rate limit exceeded 429.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "api"

    def test_analyze_cache_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of cache-related VOC."""
        result = analyzer.analyze(
            title="캐시 문제",
            content="Redis 캐시 조회 시 오류가 발생합니다. cache miss 빈번.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "cache"

    def test_analyze_no_match(self, analyzer: RuleBasedAnalyzer):
        """Test analysis when no category matches."""
        result = analyzer.analyze(
            title="일반 문의",
            content="제품 배송이 언제 되나요?",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category is None
        assert result.match_count == 0
        assert result.confidence == RuleBasedAnalyzer.MIN_CONFIDENCE
        assert "규칙 기반 분석을 수행할 수 없습니다" in result.summary

    def test_can_analyze_returns_true(self, analyzer: RuleBasedAnalyzer):
        """Test can_analyze returns True for matching content."""
        assert analyzer.can_analyze("결제 오류", "payment timeout") is True
        assert analyzer.can_analyze("로그인 문제", "token expired") is True
        assert analyzer.can_analyze("DB 오류", "database connection failed") is True

    def test_can_analyze_returns_false(self, analyzer: RuleBasedAnalyzer):
        """Test can_analyze returns False for non-matching content."""
        assert analyzer.can_analyze("일반 문의", "제품 배송 문의") is False

    def test_get_supported_categories(self, analyzer: RuleBasedAnalyzer):
        """Test getting list of supported categories."""
        categories = analyzer.get_supported_categories()

        assert isinstance(categories, list)
        assert len(categories) > 0
        assert "payment" in categories
        assert "auth" in categories
        assert "database" in categories

    def test_confidence_within_bounds(self, analyzer: RuleBasedAnalyzer):
        """Test that confidence is always within defined bounds."""
        test_cases = [
            ("결제 오류", "payment timeout PG 연동 실패 카드 결제 에러"),
            ("로그인 문제", "token expired"),
            ("DB 오류", "database error"),
            ("일반 문의", "배송 문의"),
        ]

        for title, content in test_cases:
            result = analyzer.analyze(title, content)
            assert (
                RuleBasedAnalyzer.MIN_CONFIDENCE
                <= result.confidence
                <= RuleBasedAnalyzer.MAX_CONFIDENCE
            ), f"Confidence out of bounds for: {title}"

    def test_recommendation_not_empty(self, analyzer: RuleBasedAnalyzer):
        """Test that recommendation is never empty."""
        result = analyzer.analyze(
            title="결제 오류",
            content="payment timeout",
        )
        assert result.recommendation
        assert len(result.recommendation) > 0

    def test_keywords_extracted(self, analyzer: RuleBasedAnalyzer):
        """Test that keywords are extracted correctly."""
        result = analyzer.analyze(
            title="결제 타임아웃",
            content="결제 진행 중 PG 연동 실패. payment gateway timeout 발생.",
        )

        assert isinstance(result.keywords, list)
        # Keywords are limited to 5
        assert len(result.keywords) <= 5

    def test_possible_causes_limited(self, analyzer: RuleBasedAnalyzer):
        """Test that possible causes are limited to 4."""
        result = analyzer.analyze(
            title="결제 오류",
            content="payment timeout PG error",
        )

        assert isinstance(result.possible_causes, list)
        assert len(result.possible_causes) <= 4

    def test_analyze_with_context(self, analyzer: RuleBasedAnalyzer):
        """Test analysis with additional context."""
        result = analyzer.analyze_with_context(
            title="서비스 오류",
            content="처리 중 오류가 발생했습니다",
            additional_context={"serviceName": "payment-service"},
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        # Should detect payment category from service name
        assert result.detected_category is not None

    def test_analyze_with_empty_context(self, analyzer: RuleBasedAnalyzer):
        """Test analysis with None context."""
        result = analyzer.analyze_with_context(
            title="결제 오류",
            content="payment error",
            additional_context=None,
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "payment"

    def test_korean_summary_format(self, analyzer: RuleBasedAnalyzer):
        """Test that summary is in Korean format."""
        result = analyzer.analyze(
            title="결제 오류",
            content="payment timeout",
        )

        # Summary should contain Korean category name
        assert "관련 이슈로 분석됩니다" in result.summary
        # Should mention rule-based analysis
        assert "규칙 기반 분석" in result.summary
