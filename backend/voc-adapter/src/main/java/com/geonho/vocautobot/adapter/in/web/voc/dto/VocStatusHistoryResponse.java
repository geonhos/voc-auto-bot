package com.geonho.vocautobot.adapter.in.web.voc.dto;

import com.geonho.vocautobot.domain.voc.VocStatusHistory;

import java.time.LocalDateTime;

public record VocStatusHistoryResponse(
        Long id,
        String previousStatus,
        String previousStatusLabel,
        String newStatus,
        String newStatusLabel,
        Long changedBy,
        String changeReason,
        LocalDateTime createdAt
) {
    public static VocStatusHistoryResponse from(VocStatusHistory domain) {
        return new VocStatusHistoryResponse(
                domain.getId(),
                domain.getPreviousStatus().name(),
                domain.getPreviousStatus().getDisplayName(),
                domain.getNewStatus().name(),
                domain.getNewStatus().getDisplayName(),
                domain.getChangedBy(),
                domain.getChangeReason(),
                domain.getCreatedAt()
        );
    }
}
