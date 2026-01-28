package com.geonho.vocautobot.application.analysis.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * VOC 분석 결과 DTO
 */
public record VocAnalysisDto(
    Long id,
    Long vocId,
    String status,
    String summary,
    Double confidence,
    List<String> keywords,
    List<String> possibleCauses,
    List<RelatedLogDto> relatedLogs,
    String recommendation,
    String errorMessage,
    LocalDateTime analyzedAt,
    LocalDateTime createdAt
) {
    public record RelatedLogDto(
        String timestamp,
        String logLevel,
        String serviceName,
        String message,
        Double relevanceScore
    ) {}

    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }

    public boolean isPending() {
        return "PENDING".equals(status) || "IN_PROGRESS".equals(status);
    }

    public boolean isFailed() {
        return "FAILED".equals(status);
    }
}
