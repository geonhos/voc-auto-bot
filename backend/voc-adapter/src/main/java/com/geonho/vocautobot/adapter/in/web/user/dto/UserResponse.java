package com.geonho.vocautobot.adapter.in.web.user.dto;

import com.geonho.vocautobot.domain.user.entity.User;
import com.geonho.vocautobot.domain.user.entity.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDateTime;

@Schema(description = "사용자 응답")
public record UserResponse(

        @Schema(description = "사용자 ID", example = "1")
        Long id,

        @Schema(description = "이메일", example = "user@example.com")
        String email,

        @Schema(description = "이름", example = "홍길동")
        String name,

        @Schema(description = "역할", example = "AGENT")
        UserRole role,

        @Schema(description = "활성 상태", example = "true")
        boolean active,

        @Schema(description = "마지막 로그인 시간")
        LocalDateTime lastLoginAt,

        @Schema(description = "생성 시간")
        LocalDateTime createdAt,

        @Schema(description = "수정 시간")
        LocalDateTime updatedAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole(),
                user.isActive(),
                user.getLastLoginAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
