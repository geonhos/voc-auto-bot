package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.analysis.dto.VocAnalysisDto;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * VOC 분석 결과 응답
 */
@Schema(description = "VOC AI 분석 결과 응답")
public record VocAnalysisResponse(
        @Schema(description = "분석 ID")
        Long id,

        @Schema(description = "VOC ID")
        Long vocId,

        @Schema(description = "분석 상태 (PENDING, IN_PROGRESS, COMPLETED, FAILED)")
        String status,

        @Schema(description = "분석 요약")
        String summary,

        @Schema(description = "신뢰도 (0.0 ~ 1.0)")
        Double confidence,

        @Schema(description = "키워드 목록")
        List<String> keywords,

        @Schema(description = "예상 원인 목록")
        List<String> possibleCauses,

        @Schema(description = "관련 로그 목록")
        List<RelatedLogDto> relatedLogs,

        @Schema(description = "권장 조치")
        String recommendation,

        @Schema(description = "오류 메시지 (분석 실패 시)")
        String errorMessage,

        @Schema(description = "분석 완료 시간")
        LocalDateTime analyzedAt,

        @Schema(description = "생성 시간")
        LocalDateTime createdAt
) {
    public static VocAnalysisResponse from(VocAnalysisDto dto) {
        List<RelatedLogDto> logs = dto.relatedLogs() != null
                ? dto.relatedLogs().stream().map(RelatedLogDto::from).toList()
                : List.of();

        return new VocAnalysisResponse(
                dto.id(),
                dto.vocId(),
                dto.status(),
                dto.summary(),
                dto.confidence(),
                dto.keywords() != null ? dto.keywords() : List.of(),
                dto.possibleCauses() != null ? dto.possibleCauses() : List.of(),
                logs,
                dto.recommendation(),
                dto.errorMessage(),
                dto.analyzedAt(),
                dto.createdAt()
        );
    }

    @Schema(description = "관련 로그")
    public record RelatedLogDto(
            @Schema(description = "타임스탬프")
            String timestamp,

            @Schema(description = "로그 레벨")
            String logLevel,

            @Schema(description = "서비스명")
            String serviceName,

            @Schema(description = "메시지")
            String message,

            @Schema(description = "연관도 점수")
            Double relevanceScore
    ) {
        public static RelatedLogDto from(VocAnalysisDto.RelatedLogDto log) {
            return new RelatedLogDto(
                    log.timestamp(),
                    log.logLevel(),
                    log.serviceName(),
                    log.message(),
                    log.relevanceScore()
            );
        }
    }

    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }

    public boolean isPending() {
        return "PENDING".equals(status) || "IN_PROGRESS".equals(status);
    }
}
