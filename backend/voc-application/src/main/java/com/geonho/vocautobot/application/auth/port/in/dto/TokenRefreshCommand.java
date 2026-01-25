package com.geonho.vocautobot.application.auth.port.in.dto;

import jakarta.validation.constraints.NotBlank;

public record TokenRefreshCommand(
        @NotBlank(message = "Refresh token은 필수입니다")
        String refreshToken
) {
}
