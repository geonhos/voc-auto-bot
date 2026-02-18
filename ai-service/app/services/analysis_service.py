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
    SIMILARITY_THRESHOLD = 0.45

    def __init__(
        self,
        embedding_service: EmbeddingService,
        model_name: str = "exaone3.5:7.8b",
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
        return f"""[시스템]
당신은 시스템 로그 분석 전문가입니다. 고객 VOC와 관련 시스템 로그를 분석하여 근본 원인을 파악하고 해결 방안을 제시합니다.

## 분석 카테고리 정의
- 결제 오류: 결제 게이트웨이 타임아웃, 결제 실패, PG사 연동 오류
- 인증 오류: JWT 토큰 만료, 로그인 실패, 세션 관리 문제
- 데이터베이스 오류: DB 연결 실패, 쿼리 타임아웃, 커넥션 풀 고갈
- 성능 문제: API 응답 지연, 메모리 부족, CPU 과부하
- 외부 서비스 오류: 외부 API 연동 실패, 네트워크 문제

## Few-shot 분석 예시

예시 1)
VOC: "결제가 안 됩니다. 카드 결제 시 계속 오류가 발생합니다."
로그: [ERROR] [payment-service] Payment gateway timeout after 30s
분석:
- summary: "결제 게이트웨이 타임아웃으로 인한 결제 처리 실패. PG사 서버 응답 지연이 원인으로 보입니다."
- keywords: ["payment", "gateway", "timeout"]
- possibleCauses: ["PG사 서버 응답 지연", "네트워크 대역폭 부족"]
- recommendation: "PG사 서버 상태 확인 및 타임아웃 임계값 조정 필요"

예시 2)
VOC: "로그인이 자꾸 풀립니다."
로그: [WARN] [auth-service] JWT token expired for user_id=12345
분석:
- summary: "JWT 토큰 만료로 인한 반복적인 로그아웃 현상. 토큰 갱신 로직 점검이 필요합니다."
- keywords: ["JWT", "token", "expired", "auth"]
- possibleCauses: ["토큰 유효 시간 설정 부족", "Refresh 토큰 갱신 실패"]
- recommendation: "토큰 유효 시간 연장 및 자동 갱신 로직 점검"

[사용자]
다음 VOC와 관련 로그를 분석해주세요.

VOC 제목: {request.title}
VOC 내용: {request.content}

관련 시스템 로그 (최근 24시간):
{logs_context}

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 사용 금지):
{{
  "summary": "분석 요약 (한국어, 2-3문장)",
  "confidence": 0.85,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "possibleCauses": ["원인 1", "원인 2", "원인 3"],
  "recommendation": "권장 조치 사항 (한국어)"
}}

분석 지침:
- 로그 데이터의 실제 에러 패턴을 기반으로 구체적으로 분석
- summary, possibleCauses, recommendation은 한국어로 작성
- keywords는 영어 기술 용어로 작성 (3-5개)"""

    def _create_direct_prompt(self, request: AnalysisRequest) -> str:
        """Create direct LLM prompt without log context.

        Args:
            request: Analysis request.

        Returns:
            Direct prompt string.
        """
        return f"""[시스템]
당신은 시스템 분석 전문가입니다. 관련 시스템 로그 없이 VOC 내용만으로 분석합니다.
로그 데이터가 없으므로 보수적으로 분석하고, confidence는 0.3~0.5 범위로 설정합니다.

## Few-shot 분석 예시

예시 1)
VOC: "결제가 안 됩니다"
→ summary: "결제 기능 장애 추정. 관련 로그 데이터 없이 VOC 내용만으로 분석됨."
→ keywords: ["payment", "error"], possibleCauses: ["PG사 연동 오류", "결제 모듈 장애"]

예시 2)
VOC: "데이터가 사라졌어요"
→ summary: "데이터 유실 가능성 추정. 로그 확인을 통한 정확한 원인 파악 필요."
→ keywords: ["data", "loss"], possibleCauses: ["DB 저장 실패", "캐시 만료"]

[사용자]
다음 VOC를 분석해주세요. (관련 로그 없음)

VOC 제목: {request.title}
VOC 내용: {request.content}

다음 JSON 형식으로만 응답하세요 (마크다운 코드 블록 사용 금지):
{{
  "summary": "분석 요약 (한국어). 참고: 관련 로그 데이터 없이 분석됨",
  "confidence": 0.35,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "possibleCauses": ["가능한 원인 1", "가능한 원인 2"],
  "recommendation": "권장 조치 사항 (한국어)"
}}

분석 지침:
- 로그 데이터 없이 일반적인 분석임을 명시
- 시스템 로그 확인을 권장 사항에 포함
- summary, possibleCauses, recommendation은 한국어로 작성"""

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
