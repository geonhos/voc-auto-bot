package com.geonho.vocautobot.application.voc.port.in.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Command for bulk VOC assignee assignment
 */
public record BulkAssignCommand(
        @NotEmpty(message = "VOC ID 목록을 입력해주세요")
        List<Long> vocIds,

        @NotNull(message = "담당자를 선택해주세요")
        Long assigneeId
) {
}
