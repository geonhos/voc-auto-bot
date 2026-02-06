package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.voc.port.in.dto.SimilarVocResult;
import com.geonho.vocautobot.domain.voc.VocStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

/**
 * Response DTO for similar VOC results.
 * Maps the application layer SimilarVocResult to the web adapter response format.
 */
@Schema(description = "유사 VOC 응답")
public record SimilarVocResponse(

        @Schema(description = "VOC ID", example = "42")
        Long id,

        @Schema(description = "티켓 ID", example = "VOC-20260125-0042")
        String ticketId,

        @Schema(description = "제목", example = "결제 시 타임아웃 에러")
        String title,

        @Schema(description = "상태", example = "RESOLVED")
        VocStatus status,

        @Schema(description = "유사도 (0.0 ~ 1.0)", example = "0.87")
        double similarity,

        @Schema(description = "생성 시간")
        LocalDateTime createdAt
) {
    /**
     * Creates a SimilarVocResponse from a SimilarVocResult.
     *
     * @param result the application layer result
     * @return the web adapter response
     */
    public static SimilarVocResponse from(SimilarVocResult result) {
        return new SimilarVocResponse(
                result.id(),
                result.ticketId(),
                result.title(),
                result.status(),
                result.similarity(),
                result.createdAt()
        );
    }
}
