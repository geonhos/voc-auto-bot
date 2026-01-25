package com.geonho.vocautobot.application.auth.port.in.dto;

public record TokenRefreshResult(
        String accessToken,
        String refreshToken
) {
}
