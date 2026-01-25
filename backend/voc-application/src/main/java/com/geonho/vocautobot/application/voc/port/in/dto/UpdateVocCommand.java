package com.geonho.vocautobot.application.voc.port.in.dto;

import com.geonho.vocautobot.domain.voc.VocPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Command for updating VOC information
 */
public record UpdateVocCommand(
        @NotNull(message = "VOC ID를 입력해주세요")
        Long vocId,

        @NotBlank(message = "제목을 입력해주세요")
        @Size(max = 200, message = "제목은 200자 이내로 입력해주세요")
        String title,

        @NotBlank(message = "내용을 입력해주세요")
        String content,

        VocPriority priority
) {
}
