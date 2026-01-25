package com.geonho.vocautobot.application.category.port.in.dto;

import jakarta.validation.constraints.Size;

public record UpdateCategoryCommand(
        @Size(min = 2, max = 50, message = "카테고리명은 2~50자여야 합니다")
        String name,

        @Size(max = 200, message = "설명은 200자 이하여야 합니다")
        String description,

        Integer sortOrder,

        Boolean isActive
) {
}
