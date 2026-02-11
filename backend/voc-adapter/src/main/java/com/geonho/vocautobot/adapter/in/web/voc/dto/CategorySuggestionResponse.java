package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.application.category.port.in.dto.CategorySuggestionResult;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "카테고리 추천 응답")
public record CategorySuggestionResponse(

        @Schema(description = "카테고리 ID", example = "3")
        Long categoryId,

        @Schema(description = "카테고리명", example = "결제 문의")
        String categoryName,

        @Schema(description = "카테고리 코드", example = "PAYMENT")
        String categoryCode,

        @Schema(description = "추천 확신도 (0.0~1.0)", example = "0.85")
        Double confidence,

        @Schema(description = "추천 이유", example = "결제 오류 관련 키워드가 포함되어 있습니다")
        String reason
) {
    public static CategorySuggestionResponse from(CategorySuggestionResult result) {
        return new CategorySuggestionResponse(
                result.categoryId(),
                result.categoryName(),
                result.categoryCode(),
                result.confidence(),
                result.reason()
        );
    }
}
