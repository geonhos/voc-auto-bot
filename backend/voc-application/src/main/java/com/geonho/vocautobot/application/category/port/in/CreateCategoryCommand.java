package com.geonho.vocautobot.application.category.port.in;

import com.geonho.vocautobot.domain.category.CategoryType;

public class CreateCategoryCommand {

    private final String name;
    private final CategoryType type;
    private final Long parentId;
    private final String description;
    private final int sortOrder;

    public CreateCategoryCommand(String name, CategoryType type, Long parentId, String description, int sortOrder) {
        this.name = name;
        this.type = type;
        this.parentId = parentId;
        this.description = description;
        this.sortOrder = sortOrder;
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

    public String getDescription() {
        return description;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
