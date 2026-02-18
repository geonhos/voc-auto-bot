package com.geonho.vocautobot.application.voc.port.in.dto;

import com.geonho.vocautobot.domain.voc.VocStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

/**
 * Command for bulk VOC status change
 */
public record BulkStatusChangeCommand(
        @NotEmpty(message = "VOC ID 목록을 입력해주세요")
        List<Long> vocIds,

        @NotNull(message = "변경할 상태를 선택해주세요")
        VocStatus status,

        String reason
) {
}
