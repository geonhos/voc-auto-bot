package com.geonho.vocautobot.application.voc.port.in.dto;

import com.geonho.vocautobot.domain.voc.VocPriority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Command for creating a new VOC
 */
public record CreateVocCommand(
        @NotBlank(message = "제목을 입력해주세요")
        @Size(max = 200, message = "제목은 200자 이내로 입력해주세요")
        String title,

        @NotBlank(message = "내용을 입력해주세요")
        String content,

        @NotNull(message = "카테고리를 선택해주세요")
        Long categoryId,

        @NotBlank(message = "고객 이메일을 입력해주세요")
        @Email(message = "올바른 이메일 형식이 아닙니다")
        @Size(max = 100, message = "이메일은 100자 이내로 입력해주세요")
        String customerEmail,

        @Size(max = 100, message = "고객명은 100자 이내로 입력해주세요")
        String customerName,

        @Size(max = 20, message = "전화번호는 20자 이내로 입력해주세요")
        String customerPhone,

        VocPriority priority
) {
    public CreateVocCommand {
        // Default priority to NORMAL if not specified
        if (priority == null) {
            priority = VocPriority.NORMAL;
        }
    }
}
