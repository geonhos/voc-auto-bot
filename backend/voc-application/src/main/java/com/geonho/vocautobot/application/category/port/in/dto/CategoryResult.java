package com.geonho.vocautobot.application.category.port.in.dto;

import com.geonho.vocautobot.domain.category.Category;

import java.time.LocalDateTime;

public record CategoryResult(
        Long id,
        String name,
        String code,
        String description,
        Long parentId,
        int level,
        int sortOrder,
        boolean isActive,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CategoryResult from(Category category) {
        return new CategoryResult(
                category.getId(),
                category.getName(),
                category.getCode(),
                category.getDescription(),
                category.getParentId(),
                category.getLevel(),
                category.getSortOrder(),
                category.isActive(),
                category.getCreatedAt(),
                category.getUpdatedAt()
        );
    }
}
