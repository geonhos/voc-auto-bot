package com.geonho.vocautobot.domain.category;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Category {

    private Long id;
    private String name;
    private CategoryType type;
    private Long parentId;
    private Category parent;
    private List<Category> children;
    private String description;
    private boolean isActive;
    private int sortOrder;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public Category(Long id, String name, CategoryType type, Long parentId, String description,
                    boolean isActive, int sortOrder, LocalDateTime createdAt, LocalDateTime updatedAt) {
        validateName(name);
        validateType(type, parentId);
        validateSortOrder(sortOrder);

        this.id = id;
        this.name = name;
        this.type = type;
        this.parentId = parentId;
        this.description = description;
        this.isActive = isActive;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.children = new ArrayList<>();
    }

    public static Category create(String name, CategoryType type, Long parentId, String description, int sortOrder) {
        return new Category(null, name, type, parentId, description, true, sortOrder, null, null);
    }

    public void update(String name, String description, boolean isActive, int sortOrder) {
        if (name != null) {
            validateName(name);
            this.name = name;
        }
        this.description = description;
        this.isActive = isActive;
        if (sortOrder > 0) {
            this.sortOrder = sortOrder;
        }
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void activate() {
        this.isActive = true;
    }

    public boolean hasChildren() {
        return children != null && !children.isEmpty();
    }

    public boolean isMainCategory() {
        return type == CategoryType.MAIN;
    }

    public boolean isSubCategory() {
        return type == CategoryType.SUB;
    }

    private void validateName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("카테고리 이름은 필수입니다");
        }
        if (name.length() > 100) {
            throw new IllegalArgumentException("카테고리 이름은 최대 100자까지 입력 가능합니다");
        }
    }

    private void validateType(CategoryType type, Long parentId) {
        if (type == null) {
            throw new IllegalArgumentException("카테고리 유형은 필수입니다");
        }
        if (type == CategoryType.SUB && parentId == null) {
            throw new IllegalArgumentException("중분류 카테고리는 상위 카테고리가 필수입니다");
        }
        if (type == CategoryType.MAIN && parentId != null) {
            throw new IllegalArgumentException("대분류 카테고리는 상위 카테고리를 가질 수 없습니다");
        }
    }

    private void validateSortOrder(int sortOrder) {
        if (sortOrder < 1) {
            throw new IllegalArgumentException("정렬 순서는 1 이상이어야 합니다");
        }
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public CategoryType getType() {
        return type;
    }

    public Long getParentId() {
        return parentId;
    }

    public Category getParent() {
        return parent;
    }

    public List<Category> getChildren() {
        return children;
    }

    public String getDescription() {
        return description;
    }

    public boolean isActive() {
        return isActive;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // For infrastructure layer
    public void setId(Long id) {
        this.id = id;
    }

    public void setParent(Category parent) {
        this.parent = parent;
    }

    public void setChildren(List<Category> children) {
        this.children = children != null ? children : new ArrayList<>();
    }

    public void addChild(Category child) {
        if (this.children == null) {
            this.children = new ArrayList<>();
        }
        this.children.add(child);
    }
}
