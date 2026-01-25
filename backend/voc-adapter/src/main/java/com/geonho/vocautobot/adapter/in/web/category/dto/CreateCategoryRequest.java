package com.geonho.vocautobot.adapter.in.web.category.dto;

import com.geonho.vocautobot.application.category.port.in.CreateCategoryCommand;
import com.geonho.vocautobot.domain.category.CategoryType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CreateCategoryRequest {

    @NotBlank(message = "카테고리 이름은 필수입니다")
    @Size(max = 100, message = "카테고리 이름은 최대 100자까지 입력 가능합니다")
    private String name;

    @NotNull(message = "카테고리 유형은 필수입니다")
    private CategoryType type;

    private Long parentId;

    @Size(max = 200, message = "설명은 최대 200자까지 입력 가능합니다")
    private String description;

    @NotNull(message = "정렬 순서는 필수입니다")
    @Min(value = 1, message = "정렬 순서는 1 이상이어야 합니다")
    private Integer sortOrder;

    public CreateCategoryCommand toCommand() {
        return new CreateCategoryCommand(
                name,
                type,
                parentId,
                description,
                sortOrder
        );
    }
}
