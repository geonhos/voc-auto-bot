package com.geonho.vocautobot.adapter.in.web.voc.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "카테고리 추천 요청")
public record SuggestCategoryRequest(

        @Schema(description = "VOC 제목", example = "결제 시 오류 발생")
        @NotBlank(message = "제목은 필수입니다")
        @Size(max = 200, message = "제목은 200자 이하입니다")
        String title,

        @Schema(description = "VOC 내용", example = "결제 버튼 클릭 시 500 에러가 발생합니다")
        @NotBlank(message = "내용은 필수입니다")
        @Size(max = 10000, message = "내용은 10000자 이하입니다")
        String content
) {}
