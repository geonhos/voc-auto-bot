package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "VOC 공개 상태 조회 응답")
public record VocStatusResponse(

        @Schema(description = "티켓 ID", example = "VOC-20260125-0001")
        String ticketId,

        @Schema(description = "제목", example = "상품 배송 지연 문의")
        String title,

        @Schema(description = "상태", example = "IN_PROGRESS")
        VocStatus status,

        @Schema(description = "상태 한글명", example = "처리중")
        String statusDisplayName,

        @Schema(description = "생성 시간")
        LocalDateTime createdAt,

        @Schema(description = "수정 시간")
        LocalDateTime updatedAt
) {
    public static VocStatusResponse from(Voc voc) {
        return new VocStatusResponse(
                voc.getTicketId(),
                voc.getTitle(),
                voc.getStatus(),
                voc.getStatus().getDisplayName(),
                voc.getCreatedAt(),
                voc.getUpdatedAt()
        );
    }
}
