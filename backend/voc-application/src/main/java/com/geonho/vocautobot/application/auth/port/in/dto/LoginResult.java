package com.geonho.vocautobot.application.auth.port.in.dto;

public record LoginResult(
        String accessToken,
        String refreshToken,
        UserInfo user
) {
    public record UserInfo(
            Long id,
            String username,
            String name,
            String email,
            String role
    ) {
    }
}
