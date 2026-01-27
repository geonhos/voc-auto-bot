package com.geonho.vocautobot.adapter.out.persistence.category;

import com.geonho.vocautobot.domain.category.Category;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class CategoryMapper {

    public Category toDomain(CategoryJpaEntity entity) {
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

        if (entity.getParent() != null) {
            category.setParent(toDomain(entity.getParent()));
        }

        if (entity.getChildren() != null && !entity.getChildren().isEmpty()) {
            List<Category> children = entity.getChildren().stream()
                    .map(this::toDomain)
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
