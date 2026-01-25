package com.geonho.vocautobot.application.auth.port.in.dto;

public record TokenResult(
        String accessToken,
        String refreshToken
) {
}
