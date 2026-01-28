"""Analysis service for VOC log analysis using RAG pattern."""

import json
import re
from typing import List

from langchain_community.llms import Ollama

from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    RelatedLog,
    LogDocument,
)
from app.services.embedding_service import EmbeddingService


class AnalysisService:
    """Service for analyzing VOC with related logs using RAG pattern."""

    def __init__(
        self,
        embedding_service: EmbeddingService,
        model_name: str = "llama3.2:latest",
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

    def analyze_voc(self, request: AnalysisRequest) -> AnalysisResponse:
        """Analyze VOC using RAG pattern.

        Args:
            request: Analysis request with VOC title and content.

        Returns:
            Analysis response with summary, causes, and recommendations.
        """
        # 1. Search similar logs using vector similarity
        query = f"{request.title} {request.content}"
        similar_logs = self.embedding_service.search_similar_logs(query=query, k=5)

        if not similar_logs:
            return self._create_empty_response(
                "관련 로그를 찾을 수 없습니다. 시스템 로그를 확인해주세요."
            )

        # 2. Format logs for LLM context
        logs_context = self._format_logs_for_context(similar_logs)

        # 3. Create RAG prompt
        prompt = self._create_rag_prompt(request, logs_context)

        # 4. Call LLM for analysis
        try:
            llm_response = self.llm.invoke(prompt)
            analysis = self._parse_llm_response(llm_response)
        except Exception as e:
            return self._create_empty_response(
                f"AI 분석 중 오류가 발생했습니다: {str(e)}"
            )

        # 5. Add related logs to response
        related_logs = self._convert_to_related_logs(similar_logs)
        analysis["relatedLogs"] = related_logs

        return AnalysisResponse(**analysis)

    def _format_logs_for_context(
        self, similar_logs: List[tuple[LogDocument, float]]
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
        self, similar_logs: List[tuple[LogDocument, float]]
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
                relevanceScore=round(score, 2),
            )
            for log, score in similar_logs
        ]

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
        )
