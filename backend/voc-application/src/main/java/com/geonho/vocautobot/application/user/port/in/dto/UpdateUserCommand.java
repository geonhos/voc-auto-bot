package com.geonho.vocautobot.application.user.port.in.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateUserCommand(
        @Size(min = 2, max = 50, message = "이름은 2~50자여야 합니다")
        String name,

        @Email(message = "올바른 이메일 형식이 아닙니다")
        String email,

        String role,

        Boolean isActive
) {
}
