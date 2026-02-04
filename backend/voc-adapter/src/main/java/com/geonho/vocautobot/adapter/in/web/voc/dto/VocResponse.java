package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.domain.voc.VocDomain;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "VOC 응답")
public record VocResponse(

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
        LocalDateTime updatedAt
) {
    public static VocResponse from(VocDomain voc) {
        return new VocResponse(
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
                voc.getUpdatedAt()
        );
    }
}
