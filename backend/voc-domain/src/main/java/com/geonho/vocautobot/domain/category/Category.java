package com.geonho.vocautobot.domain.category;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Builder
public class Category {

    private Long id;
    private String name;
    private String code;
    private String description;
    private Long parentId;
    private int level;
    private int sortOrder;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Builder.Default
    private List<Category> children = new ArrayList<>();

    public void updateInfo(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public void updateSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void addChild(Category child) {
        if (this.children == null) {
            this.children = new ArrayList<>();
        }
        this.children.add(child);
    }

    public boolean hasChildren() {
        return children != null && !children.isEmpty();
    }

    public boolean isRoot() {
        return parentId == null;
    }

    public static Category createRoot(String name, String code, String description, int sortOrder) {
        return Category.builder()
                .name(name)
                .code(code)
                .description(description)
                .parentId(null)
                .level(0)
                .sortOrder(sortOrder)
                .isActive(true)
                .build();
    }

    public static Category createChild(String name, String code, String description,
                                        Long parentId, int parentLevel, int sortOrder) {
        return Category.builder()
                .name(name)
                .code(code)
                .description(description)
                .parentId(parentId)
                .level(parentLevel + 1)
                .sortOrder(sortOrder)
                .isActive(true)
                .build();
    }
}
