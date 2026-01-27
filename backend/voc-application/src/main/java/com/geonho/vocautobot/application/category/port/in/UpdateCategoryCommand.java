package com.geonho.vocautobot.application.category.port.in;

public class UpdateCategoryCommand {

    private final Long id;
    private final String name;
    private final String description;
    private final Boolean isActive;
    private final Integer sortOrder;

    public UpdateCategoryCommand(Long id, String name, String description, Boolean isActive, Integer sortOrder) {
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

    public Boolean getIsActive() {
        return isActive;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }
}
