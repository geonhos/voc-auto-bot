package com.geonho.vocautobot.application.user.port.in.dto;

import com.geonho.vocautobot.domain.user.User;

import java.time.LocalDateTime;

public record UserResult(
        Long id,
        String username,
        String name,
        String email,
        String role,
        boolean isActive,
        boolean isLocked,
        LocalDateTime lastLoginAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static UserResult from(User user) {
        return new UserResult(
                user.getId(),
                user.getUsername(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.isActive(),
                user.isLocked(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
