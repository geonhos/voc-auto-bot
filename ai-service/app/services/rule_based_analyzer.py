"""Rule-based fallback analyzer for VOC analysis when vector matching fails."""

import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.data.log_templates import (
    LOG_TEMPLATES,
    find_matching_categories,
    get_severity_from_keywords,
)

logger = logging.getLogger(__name__)


@dataclass
class RuleBasedAnalysisResult:
    """Result from rule-based analysis."""

    summary: str
    confidence: float
    keywords: List[str]
    possible_causes: List[str]
    recommendation: str
    detected_category: Optional[str]
    match_count: int


class RuleBasedAnalyzer:
    """Analyzer that uses predefined rules and templates for VOC analysis.

    This analyzer is used as a fallback when vector-based matching
    doesn't find sufficient similar logs.
    """

    # Confidence range for rule-based analysis (lower than RAG)
    MIN_CONFIDENCE = 0.3
    MAX_CONFIDENCE = 0.5

    def __init__(self):
        """Initialize rule-based analyzer."""
        self.templates = LOG_TEMPLATES

    def analyze(self, title: str, content: str) -> RuleBasedAnalysisResult:
        """Analyze VOC using rule-based matching.

        Args:
            title: VOC title.
            content: VOC content.

        Returns:
            RuleBasedAnalysisResult with analysis findings.
        """
        combined_text = f"{title} {content}"

        # Find matching categories based on keywords
        category_matches = find_matching_categories(combined_text)

        if not category_matches:
            return self._create_no_match_result(title, content)

        # Get the best matching category
        best_category, match_count = category_matches[0]
        template = self.templates.get(best_category, {})

        # Extract matched keywords
        matched_keywords = self._extract_matched_keywords(
            combined_text, template.get("common_keywords", [])
        )

        # Get possible causes from template
        possible_causes = template.get("typical_causes", [])[:4]

        # Get recommendation from template
        recommended_actions = template.get("recommended_actions", [])
        recommendation = self._build_recommendation(recommended_actions)

        # Calculate confidence based on match strength
        confidence = self._calculate_confidence(match_count, len(category_matches))

        # Build summary
        summary = self._build_summary(best_category, matched_keywords, title)

        return RuleBasedAnalysisResult(
            summary=summary,
            confidence=confidence,
            keywords=matched_keywords[:5],
            possible_causes=possible_causes,
            recommendation=recommendation,
            detected_category=best_category,
            match_count=match_count,
        )

    def can_analyze(self, title: str, content: str) -> bool:
        """Check if rule-based analysis is possible for this VOC.

        Args:
            title: VOC title.
            content: VOC content.

        Returns:
            True if at least one category matches.
        """
        combined_text = f"{title} {content}"
        category_matches = find_matching_categories(combined_text)
        return len(category_matches) > 0

    def get_supported_categories(self) -> List[str]:
        """Get list of supported categories.

        Returns:
            List of category names.
        """
        return list(self.templates.keys())

    def _extract_matched_keywords(
        self, text: str, template_keywords: List[str]
    ) -> List[str]:
        """Extract keywords that match in the text.

        Args:
            text: Text to search in.
            template_keywords: Keywords from template.

        Returns:
            List of matched keywords.
        """
        text_lower = text.lower()
        matched = []
        for keyword in template_keywords:
            if keyword.lower() in text_lower:
                matched.append(keyword)
        return matched

    def _calculate_confidence(
        self, match_count: int, category_count: int
    ) -> float:
        """Calculate confidence score based on match strength.

        Args:
            match_count: Number of keyword matches for best category.
            category_count: Number of categories that matched.

        Returns:
            Confidence score between MIN_CONFIDENCE and MAX_CONFIDENCE.
        """
        # Base confidence in the middle of the range
        base_confidence = (self.MIN_CONFIDENCE + self.MAX_CONFIDENCE) / 2

        # Adjust based on match count (more matches = higher confidence)
        match_bonus = min(match_count * 0.02, 0.1)

        # Adjust based on category specificity (fewer matches = more specific)
        if category_count == 1:
            specificity_bonus = 0.05
        elif category_count <= 3:
            specificity_bonus = 0.02
        else:
            specificity_bonus = 0.0

        confidence = base_confidence + match_bonus + specificity_bonus

        # Clamp to allowed range
        return max(self.MIN_CONFIDENCE, min(self.MAX_CONFIDENCE, confidence))

    def _build_summary(
        self, category: str, keywords: List[str], title: str
    ) -> str:
        """Build analysis summary.

        Args:
            category: Detected category.
            keywords: Matched keywords.
            title: Original VOC title.

        Returns:
            Summary string in Korean.
        """
        category_names_kr = {
            "payment": "결제",
            "auth": "인증",
            "database": "데이터베이스",
            "api": "API",
            "cache": "캐시",
            "notification": "알림",
            "file": "파일",
            "search": "검색",
            "batch": "배치",
            "security": "보안",
        }

        category_kr = category_names_kr.get(category, category)
        keywords_str = ", ".join(keywords[:3]) if keywords else "관련 키워드"

        return (
            f"{category_kr} 관련 이슈로 분석됩니다. "
            f"'{title}'에서 {keywords_str} 등의 패턴이 감지되었습니다. "
            f"(규칙 기반 분석)"
        )

    def _build_recommendation(self, actions: List[str]) -> str:
        """Build recommendation string from action list.

        Args:
            actions: List of recommended actions.

        Returns:
            Combined recommendation string.
        """
        if not actions:
            return "시스템 로그를 직접 확인하여 정확한 원인을 파악해주세요."

        # Take first 3 actions and combine
        selected_actions = actions[:3]
        if len(selected_actions) == 1:
            return selected_actions[0]

        return " ".join(
            [f"{i+1}) {action}" for i, action in enumerate(selected_actions)]
        )

    def _create_no_match_result(
        self, title: str, content: str
    ) -> RuleBasedAnalysisResult:
        """Create result when no category matches.

        Args:
            title: VOC title.
            content: VOC content.

        Returns:
            RuleBasedAnalysisResult with generic response.
        """
        return RuleBasedAnalysisResult(
            summary=f"'{title}'에 대한 규칙 기반 분석을 수행할 수 없습니다. 패턴 매칭에 실패했습니다.",
            confidence=self.MIN_CONFIDENCE,
            keywords=[],
            possible_causes=[
                "사전 정의된 패턴과 일치하지 않는 새로운 유형의 이슈",
                "VOC 내용이 기술적 세부사항을 포함하지 않음",
            ],
            recommendation="시스템 로그를 직접 확인하거나 담당 개발자에게 문의해주세요.",
            detected_category=None,
            match_count=0,
        )

    def analyze_with_context(
        self,
        title: str,
        content: str,
        additional_context: Optional[Dict[str, Any]] = None,
    ) -> RuleBasedAnalysisResult:
        """Analyze VOC with additional context information.

        Args:
            title: VOC title.
            content: VOC content.
            additional_context: Optional additional context (e.g., service name, time).

        Returns:
            RuleBasedAnalysisResult with analysis findings.
        """
        # Start with basic analysis
        result = self.analyze(title, content)

        # Enhance with context if available
        if additional_context:
            service_name = additional_context.get("serviceName")
            if service_name:
                # Try to infer category from service name
                for category in self.templates.keys():
                    if category in service_name.lower():
                        if result.detected_category != category:
                            # Update if different category detected from service
                            template = self.templates.get(category, {})
                            result.possible_causes = template.get(
                                "typical_causes", []
                            )[:4]
                            result.detected_category = category

        return result
