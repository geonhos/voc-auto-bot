package com.geonho.vocautobot.application.voc.port.in.dto;

import com.geonho.vocautobot.domain.voc.VocStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Command for changing VOC status
 */
public record ChangeStatusCommand(
        @NotNull(message = "VOC ID를 입력해주세요")
        Long vocId,

        @NotNull(message = "변경할 상태를 선택해주세요")
        VocStatus newStatus,

        /**
         * Processing note or resolution description (optional).
         * Used for progressive learning when VOC is resolved.
         */
        String processingNote
) {
    /**
     * Convenience constructor without processing note.
     */
    public ChangeStatusCommand(Long vocId, VocStatus newStatus) {
        this(vocId, newStatus, null);
    }
}
