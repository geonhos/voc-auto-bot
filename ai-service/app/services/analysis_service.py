"""Analysis service for VOC log analysis using RAG pattern with fallback chain."""

import json
import logging
import re
from typing import List, Optional, Tuple

from langchain_community.llms import Ollama

from app.models.schemas import (
    AnalysisMethod,
    AnalysisRequest,
    AnalysisResponse,
    ConfidenceBreakdown,
    ConfidenceDetails,
    ConfidenceLevel,
    LogDocument,
    RelatedLog,
)
from app.services.confidence_calculator import (
    AnalysisMethod as CalcAnalysisMethod,
    ConfidenceCalculator,
)
from app.services.embedding_service import EmbeddingService
from app.services.rule_based_analyzer import RuleBasedAnalyzer

logger = logging.getLogger(__name__)


class AnalysisService:
    """Service for analyzing VOC with related logs using RAG pattern with fallback chain.

    Fallback Chain:
    1. RAG (Vector DB + LLM) - High confidence when matches found
    2. Rule-Based (Template matching) - Medium confidence fallback
    3. Direct LLM (No context) - Low confidence last resort
    """

    # Minimum vector matches required for RAG analysis
    MIN_VECTOR_MATCHES_FOR_RAG = 1
    # Minimum average similarity score for RAG analysis
    MIN_SIMILARITY_SCORE_FOR_RAG = 0.3

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
            Analysis response with summary, causes, recommendations, and confidence details.
        """
        query = f"{request.title} {request.content}"

        # Step 1: Try RAG-based analysis
        similar_logs = self._search_similar_logs(query)

        if self._should_use_rag(similar_logs):
            logger.info("Using RAG analysis method")
            return self._analyze_with_rag(request, similar_logs)

        # Step 2: Fallback to rule-based analysis
        logger.info("RAG insufficient, falling back to rule-based analysis")
        rule_result = self.rule_based_analyzer.analyze(request.title, request.content)

        if rule_result.detected_category:
            return self._create_rule_based_response(request, rule_result, similar_logs)

        # Step 3: Final fallback to direct LLM analysis
        logger.info("Rule-based insufficient, falling back to direct LLM analysis")
        return self._analyze_with_direct_llm(request, similar_logs)

    def _search_similar_logs(
        self, query: str
    ) -> List[Tuple[LogDocument, float]]:
        """Search for similar logs using vector similarity.

        Args:
            query: Search query string.

        Returns:
            List of (log_document, similarity_score) tuples.
        """
        try:
            return self.embedding_service.search_similar_logs(query=query, k=5)
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")
            return []

    def _should_use_rag(
        self, similar_logs: List[Tuple[LogDocument, float]]
    ) -> bool:
        """Determine if RAG analysis should be used based on vector matches.

        Args:
            similar_logs: List of (log, score) tuples.

        Returns:
            True if RAG analysis is appropriate.
        """
        if len(similar_logs) < self.MIN_VECTOR_MATCHES_FOR_RAG:
            return False

        avg_score = sum(score for _, score in similar_logs) / len(similar_logs)
        return avg_score >= self.MIN_SIMILARITY_SCORE_FOR_RAG

    def _analyze_with_rag(
        self,
        request: AnalysisRequest,
        similar_logs: List[Tuple[LogDocument, float]]
    ) -> AnalysisResponse:
        """Analyze VOC using RAG pattern with vector context.

        Args:
            request: Analysis request.
            similar_logs: Vector similarity search results.

        Returns:
            AnalysisResponse with RAG-based analysis.
        """
        # Format logs for LLM context
        logs_context = self._format_logs_for_context(similar_logs)

        # Create RAG prompt
        prompt = self._create_rag_prompt(request, logs_context)

        # Call LLM for analysis
        try:
            llm_response = self.llm.invoke(prompt)
            analysis = self._parse_llm_response(llm_response)
        except Exception as e:
            logger.error(f"RAG LLM analysis failed: {e}")
            # Fallback to rule-based on LLM failure
            rule_result = self.rule_based_analyzer.analyze(request.title, request.content)
            return self._create_rule_based_response(request, rule_result, similar_logs)

        # Calculate confidence
        avg_similarity = sum(score for _, score in similar_logs) / len(similar_logs)
        llm_completeness = self.confidence_calculator.calculate_llm_response_completeness(
            summary=analysis.get("summary"),
            possible_causes=analysis.get("possibleCauses"),
            recommendation=analysis.get("recommendation"),
            keywords=analysis.get("keywords")
        )

        confidence_details = self.confidence_calculator.calculate(
            analysis_method=CalcAnalysisMethod.RAG,
            vector_matches=len(similar_logs),
            avg_similarity_score=avg_similarity,
            llm_response_completeness=llm_completeness
        )

        # Build response
        related_logs = self._convert_to_related_logs(similar_logs)

        return AnalysisResponse(
            summary=analysis["summary"],
            confidence=confidence_details.score,
            keywords=analysis["keywords"],
            possibleCauses=analysis["possibleCauses"],
            relatedLogs=related_logs,
            recommendation=analysis["recommendation"],
            analysisMethod=AnalysisMethod.RAG,
            confidenceLevel=ConfidenceLevel(confidence_details.level.value),
            confidenceDetails=ConfidenceDetails(
                level=ConfidenceLevel(confidence_details.level.value),
                factors=confidence_details.factors,
                breakdown=ConfidenceBreakdown(
                    vectorMatchScore=confidence_details.breakdown.vector_match_score,
                    vectorMatchCountScore=confidence_details.breakdown.vector_match_count_score,
                    llmResponseScore=confidence_details.breakdown.llm_response_score,
                    methodWeight=confidence_details.breakdown.method_weight
                )
            ),
            vectorMatchCount=len(similar_logs)
        )

    def _create_rule_based_response(
        self,
        request: AnalysisRequest,
        rule_result,
        similar_logs: List[Tuple[LogDocument, float]]
    ) -> AnalysisResponse:
        """Create response from rule-based analysis result.

        Args:
            request: Original analysis request.
            rule_result: Rule-based analyzer result.
            similar_logs: Any vector matches found (may be empty or low quality).

        Returns:
            AnalysisResponse with rule-based analysis.
        """
        # Calculate confidence
        confidence_details = self.confidence_calculator.calculate(
            analysis_method=CalcAnalysisMethod.RULE_BASED,
            vector_matches=len(similar_logs),
            avg_similarity_score=rule_result.match_score,
            llm_response_completeness=0.7  # Rule-based responses are templated
        )

        related_logs = self._convert_to_related_logs(similar_logs) if similar_logs else []

        return AnalysisResponse(
            summary=rule_result.summary,
            confidence=confidence_details.score,
            keywords=rule_result.keywords,
            possibleCauses=rule_result.possible_causes,
            relatedLogs=related_logs,
            recommendation=rule_result.recommendation,
            analysisMethod=AnalysisMethod.RULE_BASED,
            confidenceLevel=ConfidenceLevel(confidence_details.level.value),
            confidenceDetails=ConfidenceDetails(
                level=ConfidenceLevel(confidence_details.level.value),
                factors=confidence_details.factors,
                breakdown=ConfidenceBreakdown(
                    vectorMatchScore=confidence_details.breakdown.vector_match_score,
                    vectorMatchCountScore=confidence_details.breakdown.vector_match_count_score,
                    llmResponseScore=confidence_details.breakdown.llm_response_score,
                    methodWeight=confidence_details.breakdown.method_weight
                )
            ),
            vectorMatchCount=len(similar_logs)
        )

    def _analyze_with_direct_llm(
        self,
        request: AnalysisRequest,
        similar_logs: List[Tuple[LogDocument, float]]
    ) -> AnalysisResponse:
        """Analyze VOC using direct LLM without context (last resort fallback).

        Args:
            request: Analysis request.
            similar_logs: Any vector matches found.

        Returns:
            AnalysisResponse with direct LLM analysis.
        """
        # Create direct prompt without log context
        prompt = self._create_direct_llm_prompt(request)

        try:
            llm_response = self.llm.invoke(prompt)
            analysis = self._parse_llm_response(llm_response)

            llm_completeness = self.confidence_calculator.calculate_llm_response_completeness(
                summary=analysis.get("summary"),
                possible_causes=analysis.get("possibleCauses"),
                recommendation=analysis.get("recommendation"),
                keywords=analysis.get("keywords")
            )
        except Exception as e:
            logger.error(f"Direct LLM analysis failed: {e}")
            return self._create_empty_response(
                f"AI 분석 중 오류가 발생했습니다: {str(e)}"
            )

        # Calculate confidence (low for direct LLM)
        confidence_details = self.confidence_calculator.calculate(
            analysis_method=CalcAnalysisMethod.DIRECT_LLM,
            vector_matches=len(similar_logs),
            avg_similarity_score=0.0,
            llm_response_completeness=llm_completeness
        )

        related_logs = self._convert_to_related_logs(similar_logs) if similar_logs else []

        return AnalysisResponse(
            summary=analysis["summary"],
            confidence=confidence_details.score,
            keywords=analysis["keywords"],
            possibleCauses=analysis["possibleCauses"],
            relatedLogs=related_logs,
            recommendation=analysis["recommendation"],
            analysisMethod=AnalysisMethod.DIRECT_LLM,
            confidenceLevel=ConfidenceLevel(confidence_details.level.value),
            confidenceDetails=ConfidenceDetails(
                level=ConfidenceLevel(confidence_details.level.value),
                factors=confidence_details.factors,
                breakdown=ConfidenceBreakdown(
                    vectorMatchScore=confidence_details.breakdown.vector_match_score,
                    vectorMatchCountScore=confidence_details.breakdown.vector_match_count_score,
                    llmResponseScore=confidence_details.breakdown.llm_response_score,
                    methodWeight=confidence_details.breakdown.method_weight
                )
            ),
            vectorMatchCount=len(similar_logs)
        )

    def _create_direct_llm_prompt(self, request: AnalysisRequest) -> str:
        """Create prompt for direct LLM analysis without log context.

        Args:
            request: Analysis request.

        Returns:
            Direct LLM prompt string.
        """
        return f"""You are an expert system analyst. Analyze the following VOC (Voice of Customer) issue based on your general knowledge.

Note: No related system logs were found for this issue. Provide your best analysis based on the VOC description alone.

VOC Title: {request.title}
VOC Content: {request.content}

Based on your expertise, provide:

1. **Summary**: A brief summary of the likely issue (2-3 sentences in Korean)
2. **Confidence**: Your confidence level (should be low, 0.2-0.4, since no logs are available)
3. **Keywords**: Likely technical keywords related to this issue (3-5 words)
4. **Possible Causes**: List of 2-4 possible root causes (in Korean)
5. **Recommendation**: General recommended actions to investigate (in Korean)

Respond ONLY with a valid JSON object in the following format (do not include markdown code blocks):
{{
  "summary": "분석 요약 (한국어)",
  "confidence": 0.3,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "possibleCauses": ["원인 1", "원인 2", "원인 3"],
  "recommendation": "권장 조치 사항 (한국어)"
}}

Important:
- Since no logs are available, indicate this limitation in your summary
- Keep confidence low (0.2-0.4)
- Provide general troubleshooting recommendations
- Respond in Korean for summary, causes, and recommendations"""

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
                f"[{log.timestamp}] [{log.logLevel}] [{log.serviceName}] {log.message} (Relevance: {score:.2f})"
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

        Args:
            score: Raw relevance score from vector store.

        Returns:
            Normalized score in [0, 1] range.
        """
        # If score is already in [0, 1] range, keep it
        if 0.0 <= score <= 1.0:
            return score
        # ChromaDB can return negative scores; normalize from [-300, 300] to [0, 1]
        normalized = (score + 300) / 600
        return max(0.0, min(1.0, normalized))

    def _create_empty_response(self, reason: str) -> AnalysisResponse:
        """Create empty response when analysis cannot be performed.

        Args:
            reason: Reason for empty response.

        Returns:
            Empty AnalysisResponse.
        """
        return AnalysisResponse(
            summary=reason,
            confidence=0.0,
            keywords=[],
            possibleCauses=[],
            relatedLogs=[],
            recommendation="시스템 관리자에게 문의하시거나 로그를 직접 확인해주세요.",
            analysisMethod=AnalysisMethod.DIRECT_LLM,
            confidenceLevel=ConfidenceLevel.LOW,
            confidenceDetails=ConfidenceDetails(
                level=ConfidenceLevel.LOW,
                factors=["분석 실패로 인한 최저 신뢰도"],
                breakdown=None
            ),
            vectorMatchCount=0
        )
