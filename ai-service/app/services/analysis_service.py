"""Analysis service for VOC log analysis using RAG pattern with fallback chain."""

import json
import logging
import re
from typing import List, Optional, Tuple, Dict, Any

from langchain_community.llms import Ollama

from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    RelatedLog,
    LogDocument,
    AnalysisMethodEnum,
    ConfidenceDetails,
    ConfidenceBreakdownSchema,
    ConfidenceLevelEnum,
)
from app.services.embedding_service import EmbeddingService
from app.services.rule_based_analyzer import RuleBasedAnalyzer
from app.services.confidence_calculator import (
    ConfidenceCalculator,
    AnalysisMethod,
    ConfidenceLevel,
)

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for analyzing VOC with related logs using RAG pattern with fallback chain.

    Fallback Chain:
    1. RAG (Vector DB) - Primary method with highest confidence
    2. Rule-Based - Fallback when vector matching fails
    3. Direct LLM - Last resort when no patterns match
    """

    # Minimum vector matches required for RAG analysis
    MIN_VECTOR_MATCHES = 1
    # Threshold for similarity score to consider a match useful
    SIMILARITY_THRESHOLD = 0.3

    def __init__(
        self,
        embedding_service: EmbeddingService,
        model_name: str = "gpt-oss:20b",
        ollama_base_url: str = "http://localhost:11434",
    ):
        """Initialize analysis service.

        Args:
            embedding_service: Embedding service for log search.
            model_name: Ollama LLM model name.
            ollama_base_url: Ollama server base URL.
        """
        self.embedding_service = embedding_service
        self.llm = Ollama(model=model_name, base_url=ollama_base_url, temperature=0.3)
        self.rule_based_analyzer = RuleBasedAnalyzer()
        self.confidence_calculator = ConfidenceCalculator()

    def analyze_voc(self, request: AnalysisRequest) -> AnalysisResponse:
        """Analyze VOC using fallback chain: RAG -> Rule-Based -> Direct LLM.

        Args:
            request: Analysis request with VOC title and content.

        Returns:
            Analysis response with summary, causes, and recommendations.
        """
        query = f"{request.title} {request.content}"

        # Step 1: Try RAG-based analysis
        similar_logs = self.embedding_service.search_similar_logs(query=query, k=5)

        # Filter logs with sufficient similarity
        filtered_logs = self._filter_by_similarity(similar_logs)

        if len(filtered_logs) >= self.MIN_VECTOR_MATCHES:
            return self._analyze_with_rag(request, filtered_logs)

        # Step 2: Try Rule-Based analysis
        if self.rule_based_analyzer.can_analyze(request.title, request.content):
            return self._analyze_with_rules(request)

        # Step 3: Fall back to Direct LLM analysis
        return self._analyze_with_direct_llm(request)

    def _filter_by_similarity(
        self, logs: List[Tuple[LogDocument, float]]
    ) -> List[Tuple[LogDocument, float]]:
        """Filter logs by similarity threshold.

        Args:
            logs: List of (log, score) tuples.

        Returns:
            Filtered list of logs with sufficient similarity.
        """
        return [
            (log, score)
            for log, score in logs
            if self._normalize_score(score) >= self.SIMILARITY_THRESHOLD
        ]

    def _analyze_with_rag(
        self,
        request: AnalysisRequest,
        similar_logs: List[Tuple[LogDocument, float]],
    ) -> AnalysisResponse:
        """Perform RAG-based analysis using similar logs.

        Args:
            request: Analysis request.
            similar_logs: List of similar logs with scores.

        Returns:
            Analysis response.
        """
        logger.info(f"Using RAG analysis with {len(similar_logs)} similar logs")

        # Format logs for LLM context
        logs_context = self._format_logs_for_context(similar_logs)

        # Create RAG prompt
        prompt = self._create_rag_prompt(request, logs_context)

        try:
            llm_response = self.llm.invoke(prompt)
            analysis = self._parse_llm_response(llm_response)
        except Exception as e:
            logger.error(f"RAG LLM analysis failed: {e}")
            # Fall back to rule-based if RAG LLM fails
            if self.rule_based_analyzer.can_analyze(request.title, request.content):
                return self._analyze_with_rules(request)
            return self._analyze_with_direct_llm(request)

        # Calculate confidence
        avg_similarity = self._calculate_avg_similarity(similar_logs)
        confidence_details = self.confidence_calculator.calculate(
            analysis_method=AnalysisMethod.RAG,
            vector_matches=len(similar_logs),
            avg_similarity_score=avg_similarity,
            llm_response_fields=analysis,
            category_detected=True,
            keyword_match_count=len(analysis.get("keywords", [])),
        )

        # Add related logs and enhanced fields
        related_logs = self._convert_to_related_logs(similar_logs)

        return AnalysisResponse(
            summary=analysis["summary"],
            confidence=confidence_details.score,
            keywords=analysis["keywords"],
            possibleCauses=analysis["possibleCauses"],
            relatedLogs=related_logs,
            recommendation=analysis["recommendation"],
            analysisMethod=AnalysisMethodEnum.RAG,
            confidenceDetails=self._convert_confidence_details(confidence_details),
            vectorMatchCount=len(similar_logs),
        )

    def _analyze_with_rules(self, request: AnalysisRequest) -> AnalysisResponse:
        """Perform rule-based analysis.

        Args:
            request: Analysis request.

        Returns:
            Analysis response.
        """
        logger.info("Using rule-based fallback analysis")

        result = self.rule_based_analyzer.analyze(request.title, request.content)

        # Calculate confidence
        confidence_details = self.confidence_calculator.calculate(
            analysis_method=AnalysisMethod.RULE_BASED,
            vector_matches=0,
            avg_similarity_score=0.0,
            llm_response_fields={
                "summary": result.summary,
                "confidence": result.confidence,
                "keywords": result.keywords,
                "possibleCauses": result.possible_causes,
                "recommendation": result.recommendation,
            },
            category_detected=result.detected_category is not None,
            keyword_match_count=result.match_count,
        )

        return AnalysisResponse(
            summary=result.summary,
            confidence=confidence_details.score,
            keywords=result.keywords,
            possibleCauses=result.possible_causes,
            relatedLogs=[],
            recommendation=result.recommendation,
            analysisMethod=AnalysisMethodEnum.RULE_BASED,
            confidenceDetails=self._convert_confidence_details(confidence_details),
            vectorMatchCount=0,
        )

    def _analyze_with_direct_llm(self, request: AnalysisRequest) -> AnalysisResponse:
        """Perform direct LLM analysis without context.

        Args:
            request: Analysis request.

        Returns:
            Analysis response.
        """
        logger.info("Using direct LLM analysis (no context)")

        prompt = self._create_direct_prompt(request)

        try:
            llm_response = self.llm.invoke(prompt)
            analysis = self._parse_llm_response(llm_response)
        except Exception as e:
            logger.error(f"Direct LLM analysis failed: {e}")
            return self._create_empty_response(
                f"AI 분석 중 오류가 발생했습니다: {str(e)}"
            )

        # Calculate confidence (lowest for direct LLM)
        confidence_details = self.confidence_calculator.calculate(
            analysis_method=AnalysisMethod.DIRECT_LLM,
            vector_matches=0,
            avg_similarity_score=0.0,
            llm_response_fields=analysis,
            category_detected=False,
            keyword_match_count=0,
        )

        return AnalysisResponse(
            summary=analysis["summary"],
            confidence=confidence_details.score,
            keywords=analysis["keywords"],
            possibleCauses=analysis["possibleCauses"],
            relatedLogs=[],
            recommendation=analysis["recommendation"],
            analysisMethod=AnalysisMethodEnum.DIRECT_LLM,
            confidenceDetails=self._convert_confidence_details(confidence_details),
            vectorMatchCount=0,
        )

    def _convert_confidence_details(
        self, details: Any
    ) -> ConfidenceDetails:
        """Convert internal confidence details to schema format.

        Args:
            details: Internal confidence details.

        Returns:
            ConfidenceDetails schema object.
        """
        level_map = {
            ConfidenceLevel.HIGH: ConfidenceLevelEnum.HIGH,
            ConfidenceLevel.MEDIUM: ConfidenceLevelEnum.MEDIUM,
            ConfidenceLevel.LOW: ConfidenceLevelEnum.LOW,
        }

        breakdown = None
        if hasattr(details, "breakdown") and details.breakdown:
            breakdown = ConfidenceBreakdownSchema(
                vectorMatchScore=details.breakdown.vector_match_score,
                similarityScore=details.breakdown.similarity_score,
                responseCompleteness=details.breakdown.response_completeness,
                categoryMatchScore=details.breakdown.category_match_score,
            )

        return ConfidenceDetails(
            level=level_map.get(details.level, ConfidenceLevelEnum.LOW),
            score=details.score,
            breakdown=breakdown,
            factors=details.factors,
        )

    def _calculate_avg_similarity(
        self, logs: List[Tuple[LogDocument, float]]
    ) -> float:
        """Calculate average similarity score.

        Args:
            logs: List of (log, score) tuples.

        Returns:
            Average similarity score.
        """
        if not logs:
            return 0.0
        scores = [self._normalize_score(score) for _, score in logs]
        return sum(scores) / len(scores)

    def _format_logs_for_context(
        self, similar_logs: List[Tuple[LogDocument, float]]
    ) -> str:
        """Format logs for LLM context.

        Args:
            similar_logs: List of (log, score) tuples.

        Returns:
            Formatted log context string.
        """
        log_lines = []
        for log, score in similar_logs:
            log_lines.append(
                f"[{log.timestamp}] [{log.logLevel}] [{log.serviceName}] {log.message} (Relevance: {self._normalize_score(score):.2f})"
            )

        return "\n".join(log_lines)

    def _create_rag_prompt(self, request: AnalysisRequest, logs_context: str) -> str:
        """Create RAG prompt for LLM.

        Args:
            request: Analysis request.
            logs_context: Formatted log context.

        Returns:
            RAG prompt string.
        """
        return f"""You are an expert system log analyzer. Analyze the following VOC (Voice of Customer) issue and related system logs to identify the root cause and provide recommendations.

VOC Title: {request.title}
VOC Content: {request.content}

Related System Logs (from the last 24 hours):
{logs_context}

Based on the VOC and related logs, provide a detailed analysis:

1. **Summary**: A brief summary of the issue (2-3 sentences in Korean)
2. **Confidence**: Your confidence level in this analysis (0.0 to 1.0)
3. **Keywords**: Key technical keywords from the logs (3-5 words)
4. **Possible Causes**: List of 2-4 possible root causes (in Korean)
5. **Recommendation**: Specific recommended actions to resolve the issue (in Korean)

Respond ONLY with a valid JSON object in the following format (do not include markdown code blocks):
{{
  "summary": "분석 요약 (한국어)",
  "confidence": 0.85,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "possibleCauses": ["원인 1", "원인 2", "원인 3"],
  "recommendation": "권장 조치 사항 (한국어)"
}}

Important:
- Be specific and technical in your analysis
- Base your analysis on the actual log data provided
- If logs show clear error patterns, mention them explicitly
- Provide actionable recommendations
- Respond in Korean for summary, causes, and recommendations
- Keep keywords in English"""

    def _create_direct_prompt(self, request: AnalysisRequest) -> str:
        """Create direct LLM prompt without log context.

        Args:
            request: Analysis request.

        Returns:
            Direct prompt string.
        """
        return f"""You are an expert system analyst. Analyze the following VOC (Voice of Customer) issue based on your knowledge. Note that no related system logs are available.

VOC Title: {request.title}
VOC Content: {request.content}

Based only on the VOC description, provide your best analysis:

1. **Summary**: A brief summary of the issue (2-3 sentences in Korean)
2. **Confidence**: Your confidence level (should be lower since no logs available, around 0.3-0.5)
3. **Keywords**: Likely technical keywords related to this issue (3-5 words)
4. **Possible Causes**: List of 2-4 possible root causes (in Korean)
5. **Recommendation**: General recommended actions (in Korean)

Respond ONLY with a valid JSON object in the following format (do not include markdown code blocks):
{{
  "summary": "분석 요약 (한국어). 참고: 관련 로그 데이터 없이 분석됨",
  "confidence": 0.35,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "possibleCauses": ["가능한 원인 1", "가능한 원인 2"],
  "recommendation": "권장 조치 사항 (한국어)"
}}

Important:
- Clearly indicate that this is a general analysis without log data
- Provide conservative estimates since no concrete log data is available
- Suggest checking system logs as part of recommendations
- Respond in Korean for summary, causes, and recommendations"""

    def _parse_llm_response(self, response: str) -> dict:
        """Parse LLM response to extract analysis data.

        Args:
            response: Raw LLM response.

        Returns:
            Parsed analysis dictionary.
        """
        # Remove markdown code blocks if present
        response = re.sub(r"```json\s*", "", response)
        response = re.sub(r"```\s*$", "", response)
        response = response.strip()

        # Find JSON object in response
        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON found in LLM response")

        json_str = json_match.group(0)

        try:
            analysis = json.loads(json_str)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in LLM response: {e}")

        # Validate required fields
        required_fields = [
            "summary",
            "confidence",
            "keywords",
            "possibleCauses",
            "recommendation",
        ]
        missing_fields = [f for f in required_fields if f not in analysis]
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")

        # Ensure proper types
        if not isinstance(analysis["confidence"], (int, float)):
            analysis["confidence"] = 0.5
        if not isinstance(analysis["keywords"], list):
            analysis["keywords"] = []
        if not isinstance(analysis["possibleCauses"], list):
            analysis["possibleCauses"] = []

        # Clamp confidence to [0.0, 1.0]
        analysis["confidence"] = max(0.0, min(1.0, float(analysis["confidence"])))

        return analysis

    def _convert_to_related_logs(
        self, similar_logs: List[Tuple[LogDocument, float]]
    ) -> List[RelatedLog]:
        """Convert similar logs to RelatedLog format.

        Args:
            similar_logs: List of (log, score) tuples.

        Returns:
            List of RelatedLog objects.
        """
        return [
            RelatedLog(
                timestamp=log.timestamp,
                logLevel=log.logLevel,
                serviceName=log.serviceName,
                message=log.message,
                relevanceScore=round(self._normalize_score(score), 2),
            )
            for log, score in similar_logs
        ]

    def _normalize_score(self, score: float) -> float:
        """Normalize relevance score to 0-1 range.

        With cosine distance metric, scores are already in [0, 1].

        Args:
            score: Relevance score from vector store.

        Returns:
            Normalized score in [0, 1] range.
        """
        return max(0.0, min(1.0, score))

    def _create_empty_response(self, reason: str) -> AnalysisResponse:
        """Create empty response when analysis cannot be performed.

        Args:
            reason: Reason for empty response.

        Returns:
            Empty AnalysisResponse.
        """
        # Calculate confidence for empty response
        confidence_details = self.confidence_calculator.calculate(
            analysis_method=AnalysisMethod.DIRECT_LLM,
            vector_matches=0,
            avg_similarity_score=0.0,
            llm_response_fields=None,
            category_detected=False,
            keyword_match_count=0,
        )

        return AnalysisResponse(
            summary=reason,
            confidence=0.0,
            keywords=[],
            possibleCauses=[],
            relatedLogs=[],
            recommendation="시스템 관리자에게 문의하시거나 로그를 직접 확인해주세요.",
            analysisMethod=AnalysisMethodEnum.DIRECT_LLM,
            confidenceDetails=self._convert_confidence_details(confidence_details),
            vectorMatchCount=0,
        )
