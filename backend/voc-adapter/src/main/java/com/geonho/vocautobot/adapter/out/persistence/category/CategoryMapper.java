package com.geonho.vocautobot.adapter.out.persistence.category;

import com.geonho.vocautobot.domain.category.Category;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CategoryMapper {

    public Category toDomain(CategoryJpaEntity entity) {
        return toDomain(entity, true);
    }

    /**
     * Convert entity to domain with option to include children.
     * This prevents infinite recursion in parent-child relationships.
     */
    public Category toDomain(CategoryJpaEntity entity, boolean includeChildren) {
        if (entity == null) {
            return null;
        }

        Category category = new Category(
                entity.getId(),
                entity.getName(),
                entity.getCode(),
                entity.getType(),
                entity.getParentId(),
                entity.getDescription(),
                entity.isActive(),
                entity.getSortOrder(),
                entity.getLevel(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );

        // Don't recursively load parent to avoid infinite loop
        // Parent info is already available via parentId

        if (includeChildren && entity.getChildren() != null && !entity.getChildren().isEmpty()) {
            List<Category> children = entity.getChildren().stream()
                    .map(child -> toDomain(child, true))
                    .collect(Collectors.toList());
            category.setChildren(children);
        }

        return category;
    }

    public CategoryJpaEntity toEntity(Category category) {
        if (category == null) {
            return null;
        }

        CategoryJpaEntity entity = new CategoryJpaEntity(
                category.getName(),
                category.getCode(),
                category.getType(),
                category.getParentId(),
                category.getDescription(),
                category.isActive(),
                category.getSortOrder(),
                category.getLevel()
        );

        return entity;
    }

    public List<Category> toDomainList(List<CategoryJpaEntity> entities) {
        if (entities == null) {
            return null;
        }

        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
}
