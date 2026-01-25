package com.geonho.vocautobot.application.user.port.in.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateUserCommand(
        @NotBlank(message = "아이디를 입력해주세요")
        @Size(min = 4, max = 20, message = "아이디는 4~20자여야 합니다")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "아이디는 영문, 숫자, 언더스코어만 사용 가능합니다")
        String username,

        @NotBlank(message = "비밀번호를 입력해주세요")
        @Size(min = 8, max = 100, message = "비밀번호는 8자 이상이어야 합니다")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]+$",
                message = "비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다")
        String password,

        @NotBlank(message = "이름을 입력해주세요")
        @Size(min = 2, max = 50, message = "이름은 2~50자여야 합니다")
        String name,

        @NotBlank(message = "이메일을 입력해주세요")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        String email,

        @NotBlank(message = "권한을 선택해주세요")
        String role
) {
}
