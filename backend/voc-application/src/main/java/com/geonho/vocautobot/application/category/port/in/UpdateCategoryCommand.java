package com.geonho.vocautobot.application.category.port.in;

public class UpdateCategoryCommand {

    private final Long id;
    private final String name;
    private final String description;
    private final boolean isActive;
    private final int sortOrder;

    public UpdateCategoryCommand(Long id, String name, String description, boolean isActive, int sortOrder) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.isActive = isActive;
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
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
}
