"""Rule-based fallback analyzer for VOC analysis when vector matching fails."""

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple

from app.data.log_templates import (
    LOG_TEMPLATES,
    find_category_by_keywords,
    get_template_by_category,
)


@dataclass
class RuleBasedAnalysisResult:
    """Result of rule-based analysis."""
    summary: str
    confidence: float
    keywords: List[str]
    possible_causes: List[str]
    recommendation: str
    detected_category: Optional[str]
    match_score: float


class RuleBasedAnalyzer:
    """Analyzer that uses keyword matching and templates for VOC analysis.

    This analyzer serves as a fallback when vector-based matching fails
    or returns insufficient results. It uses predefined templates and
    keyword matching to provide analysis.

    Note: Rule-based analysis has lower confidence (0.3-0.5) compared to
    RAG-based analysis since it doesn't use actual log context.
    """

    # Confidence range for rule-based analysis
    MIN_CONFIDENCE = 0.3
    MAX_CONFIDENCE = 0.5

    # Common error patterns for additional matching
    ERROR_PATTERNS = {
        "timeout": ["timeout", "timed out", "connection refused", "response time"],
        "connection": ["connection", "connect", "network", "socket"],
        "authentication": ["auth", "login", "token", "jwt", "session", "credential"],
        "permission": ["permission", "access denied", "forbidden", "unauthorized"],
        "not_found": ["not found", "404", "missing", "does not exist"],
        "server_error": ["500", "503", "internal server error", "service unavailable"],
        "validation": ["validation", "invalid", "format", "constraint"],
        "memory": ["memory", "oom", "out of memory", "heap"],
        "disk": ["disk", "storage", "quota", "space"],
    }

    def __init__(self):
        """Initialize rule-based analyzer."""
        pass

    def analyze(self, title: str, content: str) -> RuleBasedAnalysisResult:
        """Analyze VOC using rule-based matching.

        Args:
            title: VOC title
            content: VOC content/description

        Returns:
            RuleBasedAnalysisResult with analysis findings
        """
        combined_text = f"{title} {content}"

        # Step 1: Find best matching category
        category_match = find_category_by_keywords(combined_text)

        if category_match:
            category, match_score = category_match
            return self._analyze_with_category(
                title, content, category, match_score
            )
        else:
            # No category match - use error pattern analysis
            return self._analyze_with_patterns(title, content)

    def _analyze_with_category(
        self,
        title: str,
        content: str,
        category: str,
        match_score: float
    ) -> RuleBasedAnalysisResult:
        """Analyze VOC using matched category template.

        Args:
            title: VOC title
            content: VOC content
            category: Detected category
            match_score: Category match confidence

        Returns:
            RuleBasedAnalysisResult
        """
        template = get_template_by_category(category)
        if not template:
            return self._analyze_with_patterns(title, content)

        # Extract keywords that matched
        combined_text = f"{title} {content}".lower()
        matched_keywords = [
            kw for kw in template["common_keywords"]
            if kw.lower() in combined_text
        ]

        # Calculate confidence based on match score and keyword coverage
        confidence = self._calculate_confidence(match_score, len(matched_keywords))

        # Select relevant causes based on keyword matching
        possible_causes = self._select_relevant_causes(
            combined_text,
            template["typical_causes"]
        )

        # Select relevant recommendations
        recommendations = self._select_relevant_recommendations(
            combined_text,
            template["recommended_actions"]
        )

        # Generate summary
        summary = self._generate_summary(
            title,
            category,
            template["korean_description"],
            matched_keywords
        )

        return RuleBasedAnalysisResult(
            summary=summary,
            confidence=confidence,
            keywords=matched_keywords[:5],  # Top 5 keywords
            possible_causes=possible_causes[:4],  # Top 4 causes
            recommendation="\n".join(recommendations[:3]),  # Top 3 recommendations
            detected_category=category,
            match_score=match_score
        )

    def _analyze_with_patterns(
        self,
        title: str,
        content: str
    ) -> RuleBasedAnalysisResult:
        """Analyze VOC using generic error patterns when no category matches.

        Args:
            title: VOC title
            content: VOC content

        Returns:
            RuleBasedAnalysisResult
        """
        combined_text = f"{title} {content}".lower()

        # Find matching error patterns
        matched_patterns: List[Tuple[str, int]] = []
        for pattern_name, keywords in self.ERROR_PATTERNS.items():
            match_count = sum(1 for kw in keywords if kw in combined_text)
            if match_count > 0:
                matched_patterns.append((pattern_name, match_count))

        # Sort by match count
        matched_patterns.sort(key=lambda x: x[1], reverse=True)

        if matched_patterns:
            primary_pattern = matched_patterns[0][0]
            keywords = [p[0] for p in matched_patterns[:5]]

            summary = f"일반적인 {primary_pattern.replace('_', ' ')} 관련 문제로 추정됩니다. " \
                      f"구체적인 로그 분석이 필요합니다."

            possible_causes = [
                f"{primary_pattern.replace('_', ' ')} 관련 오류 발생 가능성",
                "시스템 리소스 또는 연결 상태 이상",
                "설정 값 또는 환경 변수 오류",
            ]

            recommendation = "상세 로그 확인 및 시스템 상태 점검을 권장합니다. " \
                           "문제가 지속되면 인프라 팀에 에스컬레이션하세요."

            return RuleBasedAnalysisResult(
                summary=summary,
                confidence=self.MIN_CONFIDENCE,
                keywords=keywords,
                possible_causes=possible_causes,
                recommendation=recommendation,
                detected_category=None,
                match_score=0.0
            )
        else:
            # No patterns matched - return minimal analysis
            return RuleBasedAnalysisResult(
                summary="분석할 수 있는 패턴을 찾지 못했습니다. 수동 분석이 필요합니다.",
                confidence=self.MIN_CONFIDENCE,
                keywords=[],
                possible_causes=["원인 파악을 위해 추가 정보가 필요합니다."],
                recommendation="담당자의 수동 분석이 필요합니다. 관련 로그를 직접 확인해 주세요.",
                detected_category=None,
                match_score=0.0
            )

    def _calculate_confidence(
        self,
        match_score: float,
        keyword_count: int
    ) -> float:
        """Calculate confidence score for rule-based analysis.

        Args:
            match_score: Category match score (0.0-1.0)
            keyword_count: Number of matched keywords

        Returns:
            Confidence score between MIN_CONFIDENCE and MAX_CONFIDENCE
        """
        # Base confidence on match score and keyword count
        base = self.MIN_CONFIDENCE
        range_size = self.MAX_CONFIDENCE - self.MIN_CONFIDENCE

        # Weight match_score more heavily
        score_contribution = match_score * 0.6
        # Keyword count contribution (cap at 10 keywords)
        keyword_contribution = min(keyword_count / 10, 1.0) * 0.4

        confidence = base + (range_size * (score_contribution + keyword_contribution))

        return round(min(max(confidence, self.MIN_CONFIDENCE), self.MAX_CONFIDENCE), 2)

    def _select_relevant_causes(
        self,
        text: str,
        causes: List[str]
    ) -> List[str]:
        """Select causes most relevant to the input text.

        Args:
            text: Combined input text (lowercase)
            causes: List of possible causes from template

        Returns:
            Ordered list of most relevant causes
        """
        scored_causes = []
        for cause in causes:
            # Score based on word overlap
            cause_words = set(re.findall(r'\w+', cause.lower()))
            text_words = set(re.findall(r'\w+', text))
            overlap = len(cause_words & text_words)
            scored_causes.append((cause, overlap))

        # Sort by overlap score
        scored_causes.sort(key=lambda x: x[1], reverse=True)

        # Return causes, prioritizing those with overlap but including all
        return [cause for cause, _ in scored_causes]

    def _select_relevant_recommendations(
        self,
        text: str,
        recommendations: List[str]
    ) -> List[str]:
        """Select recommendations most relevant to the input text.

        Args:
            text: Combined input text (lowercase)
            recommendations: List of recommendations from template

        Returns:
            Ordered list of most relevant recommendations
        """
        scored_recs = []
        for rec in recommendations:
            rec_words = set(re.findall(r'\w+', rec.lower()))
            text_words = set(re.findall(r'\w+', text))
            overlap = len(rec_words & text_words)
            scored_recs.append((rec, overlap))

        scored_recs.sort(key=lambda x: x[1], reverse=True)
        return [rec for rec, _ in scored_recs]

    def _generate_summary(
        self,
        title: str,
        category: str,
        category_description: str,
        keywords: List[str]
    ) -> str:
        """Generate analysis summary.

        Args:
            title: VOC title
            category: Detected category
            category_description: Korean description of category
            keywords: Matched keywords

        Returns:
            Generated summary string
        """
        if keywords:
            keyword_str = ", ".join(keywords[:3])
            return f"{category_description}로 분석됩니다. " \
                   f"'{title}'의 주요 키워드: {keyword_str}. " \
                   f"템플릿 기반 분석 결과이므로 참고용으로 활용해 주세요."
        else:
            return f"{category_description}로 분류되었습니다. " \
                   f"정확한 원인 파악을 위해 관련 로그를 직접 확인해 주세요."
