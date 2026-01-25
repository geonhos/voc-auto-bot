package com.geonho.vocautobot.application.voc.port.in.dto;

import com.geonho.vocautobot.domain.voc.Voc;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;

import java.time.LocalDateTime;

/**
 * Result DTO for VOC
 */
public record VocResult(
        Long id,
        String ticketId,
        String title,
        String content,
        VocStatus status,
        VocPriority priority,
        Long categoryId,
        String customerEmail,
        String customerName,
        String customerPhone,
        Long assigneeId,
        LocalDateTime resolvedAt,
        LocalDateTime closedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static VocResult from(Voc voc) {
        return new VocResult(
                voc.getId(),
                voc.getTicketId(),
                voc.getTitle(),
                voc.getContent(),
                voc.getStatus(),
                voc.getPriority(),
                voc.getCategoryId(),
                voc.getCustomerEmail(),
                voc.getCustomerName(),
                voc.getCustomerPhone(),
                voc.getAssigneeId(),
                voc.getResolvedAt(),
                voc.getClosedAt(),
                voc.getCreatedAt(),
                voc.getUpdatedAt()
        );
    }
}
