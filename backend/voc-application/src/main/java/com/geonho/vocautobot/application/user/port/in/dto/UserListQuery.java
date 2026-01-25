package com.geonho.vocautobot.application.user.port.in.dto;

public record UserListQuery(
        String role,
        Boolean isActive,
        String search,
        int page,
        int size
) {
    public UserListQuery {
        if (page < 0) page = 0;
        if (size <= 0 || size > 100) size = 20;
    }

    public static UserListQuery of(String role, Boolean isActive, String search, int page, int size) {
        return new UserListQuery(role, isActive, search, page, size);
    }
}
