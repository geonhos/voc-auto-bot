package com.geonho.vocautobot.domain.user;

public enum UserRole {
    ADMIN("관리자"),
    MANAGER("매니저"),
    OPERATOR("상담원");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
