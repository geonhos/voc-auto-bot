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
        """Test analysis of payment-related VOC (Korean keywords → VOC templates)."""
        result = analyzer.analyze(
            title="결제 오류 발생",
            content="결제 진행 중 타임아웃 오류가 발생했습니다. PG 연동 실패.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        # Korean VOC text matches VOC templates → "오류/버그" category
        assert result.detected_category == "오류/버그"
        assert result.match_count > 0
        assert RuleBasedAnalyzer.MIN_CONFIDENCE <= result.confidence
        assert result.confidence <= RuleBasedAnalyzer.MAX_CONFIDENCE
        assert len(result.possible_causes) > 0

    def test_analyze_auth_voc_english(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of auth VOC with English keywords → log templates fallback."""
        result = analyzer.analyze(
            title="Login failure",
            content="JWT token expired. OAuth authentication failed. Session invalid.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        # English-only text falls through VOC templates to log templates
        assert result.detected_category == "auth"
        assert result.match_count > 0
        assert len(result.keywords) > 0

    def test_analyze_database_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of database-related VOC (Korean → VOC templates)."""
        result = analyzer.analyze(
            title="데이터 조회 오류",
            content="데이터베이스 연결이 실패했습니다. Connection pool exhausted.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        # "데이터", "오류", "실패" match VOC templates → "오류/버그"
        assert result.detected_category == "오류/버그"

    def test_analyze_api_voc_english(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of API VOC with English keywords → log templates fallback."""
        result = analyzer.analyze(
            title="API call failure",
            content="503 error from upstream. Circuit breaker activated. Rate limit exceeded 429.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "api"

    def test_analyze_cache_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of cache-related VOC (Korean → VOC templates)."""
        result = analyzer.analyze(
            title="캐시 문제",
            content="Redis 캐시 조회 시 오류가 발생합니다. cache miss 빈번.",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        # "오류" matches VOC templates → "오류/버그"
        assert result.detected_category == "오류/버그"

    def test_analyze_inquiry_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of inquiry VOC (Korean VOC templates)."""
        result = analyzer.analyze(
            title="비밀번호 변경 방법",
            content="비밀번호를 변경하고 싶은데 어디서 하나요?",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "문의"
        assert result.match_count > 0

    def test_analyze_complaint_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of complaint VOC (Korean VOC templates)."""
        result = analyzer.analyze(
            title="앱이 너무 느려요",
            content="최근 업데이트 후 로딩이 5초 이상 걸립니다",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "불만/개선"

    def test_analyze_praise_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of praise VOC (Korean VOC templates)."""
        result = analyzer.analyze(
            title="상담원 감사",
            content="친절하게 안내해주셔서 감사합니다",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "칭찬"

    def test_analyze_feature_request_voc(self, analyzer: RuleBasedAnalyzer):
        """Test analysis of feature request VOC (Korean VOC templates)."""
        result = analyzer.analyze(
            title="엑셀 내보내기",
            content="보고서를 엑셀로 다운로드하는 기능을 추가해주세요",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category == "기능 요청"

    def test_analyze_no_match(self, analyzer: RuleBasedAnalyzer):
        """Test analysis when no category matches (neither VOC nor log templates)."""
        result = analyzer.analyze(
            title="ABC XYZ",
            content="lorem ipsum dolor sit amet",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category is None
        assert result.match_count == 0
        assert result.confidence == RuleBasedAnalyzer.MIN_CONFIDENCE
        assert "규칙 기반 분석을 수행할 수 없습니다" in result.summary

    def test_can_analyze_returns_true(self, analyzer: RuleBasedAnalyzer):
        """Test can_analyze returns True for matching content."""
        # Korean text matches VOC templates
        assert analyzer.can_analyze("결제 오류", "결제 실패") is True
        assert analyzer.can_analyze("비밀번호 변경", "어디서 하나요") is True
        # English text matches log templates
        assert analyzer.can_analyze("Login issue", "token expired") is True

    def test_can_analyze_returns_false(self, analyzer: RuleBasedAnalyzer):
        """Test can_analyze returns False for non-matching content."""
        assert analyzer.can_analyze("ABC", "lorem ipsum") is False

    def test_get_supported_categories(self, analyzer: RuleBasedAnalyzer):
        """Test getting list of supported categories (log templates)."""
        categories = analyzer.get_supported_categories()

        assert isinstance(categories, list)
        assert len(categories) > 0
        assert "payment" in categories
        assert "auth" in categories
        assert "database" in categories

    def test_confidence_within_bounds(self, analyzer: RuleBasedAnalyzer):
        """Test that confidence is always within defined bounds."""
        test_cases = [
            ("결제 오류", "결제 실패 PG 연동 실패 카드 결제 에러"),
            ("Login failure", "token expired"),
            ("DB 오류", "database error"),
            ("ABC", "lorem ipsum"),
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
            content="결제 실패",
        )
        assert result.recommendation
        assert len(result.recommendation) > 0

    def test_keywords_extracted(self, analyzer: RuleBasedAnalyzer):
        """Test that keywords are extracted correctly."""
        result = analyzer.analyze(
            title="결제 타임아웃",
            content="결제 진행 중 PG 연동 실패. 결제오류 발생.",
        )

        assert isinstance(result.keywords, list)
        assert len(result.keywords) <= 5

    def test_possible_causes_limited(self, analyzer: RuleBasedAnalyzer):
        """Test that possible causes are limited."""
        result = analyzer.analyze(
            title="결제 오류",
            content="결제 실패 PG 오류",
        )

        assert isinstance(result.possible_causes, list)

    def test_analyze_with_context(self, analyzer: RuleBasedAnalyzer):
        """Test analysis with additional context."""
        result = analyzer.analyze_with_context(
            title="서비스 오류",
            content="처리 중 오류가 발생했습니다",
            additional_context={"serviceName": "payment-service"},
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        assert result.detected_category is not None

    def test_analyze_with_empty_context(self, analyzer: RuleBasedAnalyzer):
        """Test analysis with None context."""
        result = analyzer.analyze_with_context(
            title="결제 오류",
            content="결제 실패 에러",
            additional_context=None,
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        # Korean text matches VOC templates → "오류/버그"
        assert result.detected_category == "오류/버그"

    def test_korean_summary_format(self, analyzer: RuleBasedAnalyzer):
        """Test that summary is in Korean format with VOC category."""
        result = analyzer.analyze(
            title="결제 오류",
            content="결제 실패 에러",
        )

        # VOC template summary format
        assert "카테고리로 분류됩니다" in result.summary
        assert "규칙 기반 분석" in result.summary

    def test_log_template_fallback(self, analyzer: RuleBasedAnalyzer):
        """Test that log templates are used when VOC templates don't match."""
        result = analyzer.analyze(
            title="Circuit breaker",
            content="503 upstream timeout load balancer failure",
        )

        assert isinstance(result, RuleBasedAnalysisResult)
        # English technical text → log templates → "api"
        assert result.detected_category == "api"
        assert "관련 이슈로 분석됩니다" in result.summary
