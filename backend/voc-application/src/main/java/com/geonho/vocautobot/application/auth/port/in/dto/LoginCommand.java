package com.geonho.vocautobot.application.auth.port.in.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginCommand(
        @NotBlank(message = "아이디를 입력해주세요")
        String username,

        @NotBlank(message = "비밀번호를 입력해주세요")
        String password
) {
}
