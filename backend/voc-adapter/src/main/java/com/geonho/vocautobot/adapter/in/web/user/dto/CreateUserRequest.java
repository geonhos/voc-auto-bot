package com.geonho.vocautobot.adapter.in.web.user.dto;

import com.geonho.vocautobot.application.user.port.in.CreateUserUseCase.CreateUserCommand;
import com.geonho.vocautobot.domain.user.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Schema(description = "사용자 생성 요청")
public record CreateUserRequest(

        @Schema(description = "이메일", example = "user@example.com")
        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        String email,

        @Schema(description = "비밀번호", example = "password123!")
        @NotBlank(message = "비밀번호는 필수입니다")
        @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
        String password,

        @Schema(description = "이름", example = "홍길동")
        @NotBlank(message = "이름은 필수입니다")
        String name,

        @Schema(description = "역할", example = "AGENT")
        @NotNull(message = "역할은 필수입니다")
        UserRole role
) {
    public CreateUserCommand toCommand() {
        return new CreateUserCommand(email, password, name, role);
    }
}
