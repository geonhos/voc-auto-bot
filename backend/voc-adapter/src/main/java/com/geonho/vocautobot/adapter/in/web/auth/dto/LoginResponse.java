package com.geonho.vocautobot.adapter.in.web.auth.dto;

import com.geonho.vocautobot.application.auth.port.in.dto.LoginResult;

public record LoginResponse(
        String accessToken,
        String refreshToken,
        UserInfo user
) {
    public record UserInfo(
            Long id,
            String email,
            String name,
            String role
    ) {
    }

    public static LoginResponse from(LoginResult result) {
        return new LoginResponse(
                result.accessToken(),
                result.refreshToken(),
                new UserInfo(
                        result.userId(),
                        result.email(),
                        result.name(),
                        result.role()
                )
        );
    }
}
