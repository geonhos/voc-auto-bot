package com.geonho.vocautobot.adapter.in.web.category.dto;

import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class CategoryTreeResponse {

    private Long id;
    private String name;
    private CategoryType type;
    private boolean isActive;
    private int sortOrder;
    private List<CategoryTreeResponse> children;

    public static CategoryTreeResponse from(Category category) {
        return CategoryTreeResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .isActive(category.isActive())
                .sortOrder(category.getSortOrder())
                .children(category.getChildren() != null
                        ? category.getChildren().stream()
                        .map(CategoryTreeResponse::from)
                        .collect(Collectors.toList())
                        : null)
                .build();
    }

    public static List<CategoryTreeResponse> fromList(List<Category> categories) {
        if (categories == null) {
            return null;
        }

        return categories.stream()
                .map(CategoryTreeResponse::from)
                .collect(Collectors.toList());
    }
}
