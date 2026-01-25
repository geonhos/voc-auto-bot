package com.geonho.vocautobot.adapter.in.web.user.dto;

import com.geonho.vocautobot.application.user.port.in.UpdateUserUseCase.UpdateUserCommand;
import com.geonho.vocautobot.domain.user.entity.UserRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Schema(description = "사용자 수정 요청")
public record UpdateUserRequest(

        @Schema(description = "이름", example = "홍길동")
        @NotBlank(message = "이름은 필수입니다")
        String name,

        @Schema(description = "이메일", example = "user@example.com")
        @NotBlank(message = "이메일은 필수입니다")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        String email,

        @Schema(description = "역할", example = "MANAGER")
        @NotNull(message = "역할은 필수입니다")
        UserRole role
) {
    public UpdateUserCommand toCommand(Long userId) {
        return new UpdateUserCommand(userId, name, email, role);
    }
}
