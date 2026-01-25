package com.geonho.vocautobot.adapter.in.web.category.dto;

import com.geonho.vocautobot.application.category.port.in.UpdateCategoryCommand;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateCategoryRequest {

    @Size(max = 100, message = "카테고리 이름은 최대 100자까지 입력 가능합니다")
    private String name;

    @Size(max = 200, message = "설명은 최대 200자까지 입력 가능합니다")
    private String description;

    private Boolean isActive;

    @Min(value = 1, message = "정렬 순서는 1 이상이어야 합니다")
    private Integer sortOrder;

    public UpdateCategoryCommand toCommand(Long id) {
        return new UpdateCategoryCommand(
                id,
                name,
                description,
                isActive != null ? isActive : true,
                sortOrder != null ? sortOrder : 1
        );
    }
}
