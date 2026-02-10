package com.geonho.vocautobot.adapter.in.web.notification.dto;

import com.geonho.vocautobot.domain.notification.Notification;
import lombok.Builder;

import java.time.LocalDateTime;

@Builder
public record NotificationResponse(
        Long id,
        String type,
        String title,
        String message,
        Long vocId,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .vocId(notification.getVocId())
                .read(notification.isRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
