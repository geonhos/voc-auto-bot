package com.geonho.vocautobot.application.category.port.in.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCategoryCommand(
        @NotBlank(message = "카테고리명을 입력해주세요")
        @Size(min = 2, max = 50, message = "카테고리명은 2~50자여야 합니다")
        String name,

        @NotBlank(message = "카테고리 코드를 입력해주세요")
        @Size(min = 2, max = 30, message = "카테고리 코드는 2~30자여야 합니다")
        @Pattern(regexp = "^[A-Z0-9_]+$", message = "카테고리 코드는 대문자, 숫자, 언더스코어만 사용 가능합니다")
        String code,

        @Size(max = 200, message = "설명은 200자 이하여야 합니다")
        String description,

        Long parentId,

        Integer sortOrder
) {
    public CreateCategoryCommand {
        if (sortOrder == null) {
            sortOrder = 0;
        }
    }
}
