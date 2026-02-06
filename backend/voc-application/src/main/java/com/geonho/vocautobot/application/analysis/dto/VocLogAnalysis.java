package com.geonho.vocautobot.application.analysis.dto;

import java.util.List;

/**
 * VOC 로그 분석 결과 DTO
 * VOC 생성 시 관련 로그를 AI로 분석한 결과
 */
public record VocLogAnalysis(
    String summary,
    Double confidence,
    List<String> keywords,
    List<String> possibleCauses,
    List<RelatedLog> relatedLogs,
    String recommendation,
    // Enhanced fields for confidence display
    ConfidenceLevel confidenceLevel,
    AnalysisMethod analysisMethod,
    Integer vectorMatchCount,
    ConfidenceDetails confidenceDetails
) {

    /**
     * 신뢰도 레벨 enum
     */
    public enum ConfidenceLevel {
        HIGH,   // 0.7 이상
        MEDIUM, // 0.4 ~ 0.7
        LOW     // 0.4 미만
    }

    /**
     * 분석 방법 enum
     */
    public enum AnalysisMethod {
        RAG("rag"),           // RAG 기반 분석 (벡터 DB 참조)
        RULE_BASED("rule_based"),  // 규칙 기반 분석
        DIRECT_LLM("direct_llm");  // 직접 LLM 분석 (참조 없음)

        private final String value;

        AnalysisMethod(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static AnalysisMethod fromValue(String value) {
            if (value == null) {
                return null;
            }
            for (AnalysisMethod method : values()) {
                if (method.value.equals(value)) {
                    return method;
                }
            }
            return null;
        }
    }

    /**
     * 신뢰도 상세 정보
     */
    public record ConfidenceDetails(
        ConfidenceLevel level,
        Double score,
        ConfidenceBreakdown breakdown,
        List<String> factors
    ) {}

    /**
     * 신뢰도 점수 세부 breakdown
     */
    public record ConfidenceBreakdown(
        Double vectorMatchScore,
        Double similarityScore,
        Double responseCompleteness,
        Double categoryMatchScore
    ) {}

    /**
     * 관련 로그 정보
     */
    public record RelatedLog(
        String timestamp,
        String logLevel,
        String serviceName,
        String message,
        Double relevanceScore
    ) {}

    /**
     * 빈 분석 결과 생성 (로그가 없거나 분석 불가능한 경우)
     */
    public static VocLogAnalysis empty(String reason) {
        return new VocLogAnalysis(
            reason,
            0.0,
            List.of(),
            List.of(),
            List.of(),
            "로그 분석을 수행할 수 없습니다.",
            ConfidenceLevel.LOW,
            null,
            0,
            null
        );
    }

    /**
     * 기존 생성자와의 호환성을 위한 팩토리 메서드
     */
    public static VocLogAnalysis of(
        String summary,
        Double confidence,
        List<String> keywords,
        List<String> possibleCauses,
        List<RelatedLog> relatedLogs,
        String recommendation
    ) {
        ConfidenceLevel level = determineConfidenceLevel(confidence);
        return new VocLogAnalysis(
            summary,
            confidence,
            keywords,
            possibleCauses,
            relatedLogs,
            recommendation,
            level,
            null,
            null,
            null
        );
    }

    /**
     * confidence 값으로부터 ConfidenceLevel 결정
     */
    public static ConfidenceLevel determineConfidenceLevel(Double confidence) {
        if (confidence == null) {
            return ConfidenceLevel.LOW;
        }
        if (confidence >= 0.7) {
            return ConfidenceLevel.HIGH;
        } else if (confidence >= 0.4) {
            return ConfidenceLevel.MEDIUM;
        } else {
            return ConfidenceLevel.LOW;
        }
    }

    /**
     * 분석 결과가 유효한지 확인
     */
    public boolean isValid() {
        return confidence != null && confidence > 0.3;
    }

    /**
     * 신뢰도가 낮은지 확인
     */
    public boolean isLowConfidence() {
        return confidenceLevel == ConfidenceLevel.LOW ||
               (confidence != null && confidence < 0.4);
    }

    /**
     * RAG 기반 분석인지 확인
     */
    public boolean isRagBased() {
        return analysisMethod == AnalysisMethod.RAG;
    }
}
