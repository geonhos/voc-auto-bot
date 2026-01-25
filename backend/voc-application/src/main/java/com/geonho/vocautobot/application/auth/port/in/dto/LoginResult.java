package com.geonho.vocautobot.application.auth.port.in.dto;

public record LoginResult(
        String accessToken,
        String refreshToken,
        Long userId,
        String email,
        String name,
        String role
) {
}
