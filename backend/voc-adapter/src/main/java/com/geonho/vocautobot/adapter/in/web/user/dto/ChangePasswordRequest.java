package com.geonho.vocautobot.adapter.in.web.user.dto;

import com.geonho.vocautobot.application.user.port.in.ChangePasswordUseCase.ChangePasswordCommand;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "비밀번호 변경 요청")
public record ChangePasswordRequest(

        @Schema(description = "현재 비밀번호", example = "oldPassword123!")
        @NotBlank(message = "현재 비밀번호는 필수입니다")
        String currentPassword,

        @Schema(description = "새 비밀번호", example = "newPassword123!")
        @NotBlank(message = "새 비밀번호는 필수입니다")
        @Size(min = 8, message = "비밀번호는 최소 8자 이상이어야 합니다")
        String newPassword
) {
    public ChangePasswordCommand toCommand(Long userId) {
        return new ChangePasswordCommand(userId, currentPassword, newPassword);
    }
}
