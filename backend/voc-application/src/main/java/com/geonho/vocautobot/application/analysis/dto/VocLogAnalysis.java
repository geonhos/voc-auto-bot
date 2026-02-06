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
    // Enhanced fields for confidence reporting
    ConfidenceLevel confidenceLevel,
    AnalysisMethod analysisMethod,
    Integer vectorMatchCount,
    ConfidenceDetails confidenceDetails
) {

    /**
     * 신뢰도 레벨 (높음, 중간, 낮음)
     */
    public enum ConfidenceLevel {
        HIGH("HIGH"),
        MEDIUM("MEDIUM"),
        LOW("LOW");

        private final String value;

        ConfidenceLevel(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static ConfidenceLevel fromValue(String value) {
            if (value == null) {
                return null;
            }
            for (ConfidenceLevel level : values()) {
                if (level.value.equalsIgnoreCase(value)) {
                    return level;
                }
            }
            return null;
        }
    }

    /**
     * 분석 방법 (RAG, 규칙 기반, 직접 LLM)
     */
    public enum AnalysisMethod {
        RAG("rag"),
        RULE_BASED("rule_based"),
        DIRECT_LLM("direct_llm");

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
                if (method.value.equalsIgnoreCase(value)) {
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
        List<String> factors,
        ConfidenceBreakdown breakdown
    ) {}

    /**
     * 신뢰도 계산 breakdown
     */
    public record ConfidenceBreakdown(
        Double vectorMatchScore,
        Double vectorMatchCountScore,
        Double llmResponseScore,
        Double methodWeight
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
            AnalysisMethod.DIRECT_LLM,
            0,
            new ConfidenceDetails(
                ConfidenceLevel.LOW,
                List.of("분석 실패로 인한 최저 신뢰도"),
                null
            )
        );
    }

    /**
     * 기본 생성자 (하위 호환성을 위해)
     * 새 필드가 없는 응답에 대한 처리
     */
    public VocLogAnalysis(
        String summary,
        Double confidence,
        List<String> keywords,
        List<String> possibleCauses,
        List<RelatedLog> relatedLogs,
        String recommendation
    ) {
        this(
            summary,
            confidence,
            keywords,
            possibleCauses,
            relatedLogs,
            recommendation,
            confidence != null ? determineConfidenceLevel(confidence) : ConfidenceLevel.LOW,
            null,
            null,
            null
        );
    }

    /**
     * confidence 값으로부터 ConfidenceLevel 결정
     */
    private static ConfidenceLevel determineConfidenceLevel(Double confidence) {
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
     * 신뢰도가 높은지 확인
     */
    public boolean isHighConfidence() {
        return confidenceLevel == ConfidenceLevel.HIGH;
    }

    /**
     * 신뢰도가 낮은지 확인 (경고 표시용)
     */
    public boolean isLowConfidence() {
        return confidenceLevel == ConfidenceLevel.LOW;
    }

    /**
     * RAG 분석 여부 확인
     */
    public boolean isRagAnalysis() {
        return analysisMethod == AnalysisMethod.RAG;
    }
}
