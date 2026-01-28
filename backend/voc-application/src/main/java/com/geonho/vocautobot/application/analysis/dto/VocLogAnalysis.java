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
    String recommendation
) {

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
            "로그 분석을 수행할 수 없습니다."
        );
    }

    /**
     * 분석 결과가 유효한지 확인
     */
    public boolean isValid() {
        return confidence != null && confidence > 0.3;
    }
}
