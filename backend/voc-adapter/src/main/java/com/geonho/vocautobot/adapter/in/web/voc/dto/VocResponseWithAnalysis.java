package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * VOC 응답 (AI 로그 분석 포함)
 */
@Schema(description = "VOC 응답 with AI 로그 분석")
public record VocResponseWithAnalysis(

        @Schema(description = "VOC ID", example = "1")
        Long id,

        @Schema(description = "티켓 ID", example = "VOC-20260125-0001")
        String ticketId,

        @Schema(description = "제목", example = "상품 배송 지연 문의")
        String title,

        @Schema(description = "내용", example = "주문한 상품이 예정일보다 3일 지연되고 있습니다.")
        String content,

        @Schema(description = "상태", example = "NEW")
        VocStatus status,

        @Schema(description = "우선순위", example = "NORMAL")
        VocPriority priority,

        @Schema(description = "카테고리 ID", example = "1")
        Long categoryId,

        @Schema(description = "고객 이메일", example = "customer@example.com")
        String customerEmail,

        @Schema(description = "고객명", example = "홍길동")
        String customerName,

        @Schema(description = "고객 전화번호", example = "010-1234-5678")
        String customerPhone,

        @Schema(description = "담당자 ID", example = "5")
        Long assigneeId,

        @Schema(description = "해결 완료 시간")
        LocalDateTime resolvedAt,

        @Schema(description = "종료 시간")
        LocalDateTime closedAt,

        @Schema(description = "생성 시간")
        LocalDateTime createdAt,

        @Schema(description = "수정 시간")
        LocalDateTime updatedAt,

        @Schema(description = "AI 로그 분석 결과")
        LogAnalysisDto logAnalysis
) {
    
    /**
     * VOC와 로그 분석 결과로부터 응답 생성
     */
    public static VocResponseWithAnalysis from(Voc voc, VocLogAnalysis logAnalysis) {
        return new VocResponseWithAnalysis(
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
                logAnalysis != null ? LogAnalysisDto.from(logAnalysis) : null
        );
    }

    /**
     * VOC만으로 응답 생성 (로그 분석 없음)
     */
    public static VocResponseWithAnalysis from(Voc voc) {
        return from(voc, null);
    }

    /**
     * 로그 분석 DTO
     */
    @Schema(description = "AI 로그 분석 결과")
    public record LogAnalysisDto(
            @Schema(description = "분석 요약", example = "데이터베이스 연결 타임아웃으로 인한 오류로 추정됩니다.")
            String summary,

            @Schema(description = "신뢰도", example = "0.85")
            Double confidence,

            @Schema(description = "키워드", example = "[\"timeout\", \"database\", \"connection\"]")
            java.util.List<String> keywords,

            @Schema(description = "예상 원인", example = "[\"DB 커넥션 풀 부족\", \"네트워크 지연\"]")
            java.util.List<String> possibleCauses,

            @Schema(description = "관련 로그")
            java.util.List<RelatedLogDto> relatedLogs,

            @Schema(description = "권장 조치", example = "DB 커넥션 풀 설정을 확인하고 증가시키는 것을 권장합니다.")
            String recommendation
    ) {
        public static LogAnalysisDto from(VocLogAnalysis analysis) {
            return new LogAnalysisDto(
                    analysis.summary(),
                    analysis.confidence(),
                    analysis.keywords(),
                    analysis.possibleCauses(),
                    analysis.relatedLogs().stream()
                            .map(RelatedLogDto::from)
                            .toList(),
                    analysis.recommendation()
            );
        }
    }

    /**
     * 관련 로그 DTO
     */
    @Schema(description = "관련 로그 정보")
    public record RelatedLogDto(
            @Schema(description = "타임스탬프", example = "2026-01-28 12:34:56")
            String timestamp,

            @Schema(description = "로그 레벨", example = "ERROR")
            String logLevel,

            @Schema(description = "서비스명", example = "voc-backend")
            String serviceName,

            @Schema(description = "메시지", example = "Connection timeout after 30s")
            String message,

            @Schema(description = "연관도 점수", example = "0.8")
            Double relevanceScore
    ) {
        public static RelatedLogDto from(VocLogAnalysis.RelatedLog log) {
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
