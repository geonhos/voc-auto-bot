package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.analysis.dto.VocAnalysisDto;
import com.geonho.vocautobot.domain.voc.VocAttachmentDomain;
import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocMemoDomain;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;
import java.util.List;

/**
 * VOC 상세 조회 응답 (분석 결과 포함)
 */
@Schema(description = "VOC 상세 응답 (AI 분석 결과 포함)")
public record VocDetailResponse(
        @Schema(description = "VOC ID")
        Long id,

        @Schema(description = "티켓 ID")
        String ticketId,

        @Schema(description = "제목")
        String title,

        @Schema(description = "내용")
        String content,

        @Schema(description = "상태")
        VocStatus status,

        @Schema(description = "우선순위")
        VocPriority priority,

        @Schema(description = "카테고리 ID")
        Long categoryId,

        @Schema(description = "고객 이메일")
        String customerEmail,

        @Schema(description = "고객명")
        String customerName,

        @Schema(description = "고객 전화번호")
        String customerPhone,

        @Schema(description = "담당자 ID")
        Long assigneeId,

        @Schema(description = "해결 시간")
        LocalDateTime resolvedAt,

        @Schema(description = "종료 시간")
        LocalDateTime closedAt,

        @Schema(description = "생성 시간")
        LocalDateTime createdAt,

        @Schema(description = "수정 시간")
        LocalDateTime updatedAt,

        @Schema(description = "첨부파일 목록")
        List<AttachmentDto> attachments,

        @Schema(description = "메모 목록")
        List<MemoDto> memos,

        @Schema(description = "AI 분석 결과")
        AnalysisDto aiAnalysis,

        @Schema(description = "감성 분석 결과 (positive, negative, neutral)")
        String sentiment,

        @Schema(description = "감성 분석 신뢰도 (0.0 ~ 1.0)")
        Double sentimentConfidence
) {
    public static VocDetailResponse from(VocDomain voc, VocAnalysisDto analysis) {
        List<AttachmentDto> attachments = voc.getAttachments() != null
                ? voc.getAttachments().stream().map(AttachmentDto::from).toList()
                : List.of();

        List<MemoDto> memos = voc.getMemos() != null
                ? voc.getMemos().stream().map(MemoDto::from).toList()
                : List.of();

        return new VocDetailResponse(
                voc.getId(),
                voc.getTicketId(),
                voc.getTitle(),
                voc.getContent(),
                voc.getStatus(),
                voc.getPriority(),
                voc.getCategoryId(),
                voc.getCustomerEmail(),
                voc.getCustomerName(),
                voc.getCustomerPhone(),
                voc.getAssigneeId(),
                voc.getResolvedAt(),
                voc.getClosedAt(),
                voc.getCreatedAt(),
                voc.getUpdatedAt(),
                attachments,
                memos,
                analysis != null ? AnalysisDto.from(analysis) : null,
                voc.getSentiment(),
                voc.getSentimentConfidence()
        );
    }

    @Schema(description = "첨부파일")
    public record AttachmentDto(
            Long id,
            String originalFileName,
            String storedFileName,
            String filePath,
            Long fileSize,
            String mimeType,
            String downloadUrl
    ) {
        public static AttachmentDto from(VocAttachmentDomain attachment) {
            return new AttachmentDto(
                    attachment.getId(),
                    attachment.getOriginalFilename(),
                    attachment.getStoredFilename(),
                    attachment.getFilePath(),
                    attachment.getFileSize(),
                    attachment.getContentType(),
                    "/api/v1/files/" + attachment.getStoredFilename()
            );
        }
    }

    @Schema(description = "메모")
    public record MemoDto(
            Long id,
            String content,
            Long authorId,
            boolean isInternal,
            LocalDateTime createdAt
    ) {
        public static MemoDto from(VocMemoDomain memo) {
            return new MemoDto(
                    memo.getId(),
                    memo.getContent(),
                    memo.getAuthorId(),
                    memo.isInternal(),
                    memo.getCreatedAt()
            );
        }
    }

    @Schema(description = "AI 분석 결과")
    public record AnalysisDto(
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
            LocalDateTime analyzedAt
    ) {
        public static AnalysisDto from(VocAnalysisDto dto) {
            List<RelatedLogDto> logs = dto.relatedLogs() != null
                    ? dto.relatedLogs().stream().map(RelatedLogDto::from).toList()
                    : List.of();

            return new AnalysisDto(
                    dto.status(),
                    dto.summary(),
                    dto.confidence(),
                    dto.keywords() != null ? dto.keywords() : List.of(),
                    dto.possibleCauses() != null ? dto.possibleCauses() : List.of(),
                    logs,
                    dto.recommendation(),
                    dto.errorMessage(),
                    dto.analyzedAt()
            );
        }

        public boolean isCompleted() {
            return "COMPLETED".equals(status);
        }

        public boolean isPending() {
            return "PENDING".equals(status) || "IN_PROGRESS".equals(status);
        }
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
}
