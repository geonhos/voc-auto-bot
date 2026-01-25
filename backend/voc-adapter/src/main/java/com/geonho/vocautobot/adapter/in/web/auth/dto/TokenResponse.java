package com.geonho.vocautobot.adapter.in.web.auth.dto;

import com.geonho.vocautobot.application.auth.port.in.dto.TokenResult;

public record TokenResponse(
        String accessToken,
        String refreshToken
) {
    public static TokenResponse from(TokenResult result) {
        return new TokenResponse(
                result.accessToken(),
                result.refreshToken()
        );
    }
}
