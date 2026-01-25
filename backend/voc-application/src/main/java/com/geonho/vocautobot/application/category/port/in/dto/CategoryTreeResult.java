package com.geonho.vocautobot.application.category.port.in.dto;

import com.geonho.vocautobot.domain.category.Category;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public record CategoryTreeResult(
        Long id,
        String name,
        String code,
        String description,
        Long parentId,
        int level,
        int sortOrder,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<CategoryTreeResult> children
) {
    public static CategoryTreeResult from(Category category) {
        List<CategoryTreeResult> childResults = new ArrayList<>();
        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            childResults = category.getChildren().stream()
                    .map(CategoryTreeResult::from)
                    .collect(Collectors.toList());
        }

        return new CategoryTreeResult(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.getDescription(),
                category.getParentId(),
                category.getLevel(),
                category.getSortOrder(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt(),
                childResults
        );
    }
}
