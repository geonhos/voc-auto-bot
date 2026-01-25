package com.geonho.vocautobot.application.voc.port.in.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Command for assigning VOC to a user
 */
public record AssignVocCommand(
        @NotNull(message = "VOC ID를 입력해주세요")
        Long vocId,

        @NotNull(message = "담당자를 선택해주세요")
        Long assigneeId
) {
}
