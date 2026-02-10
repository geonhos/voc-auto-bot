package com.geonho.vocautobot.domain.notification;

import lombok.*;

import java.time.LocalDateTime;

/**
 * 알림 도메인 모델
 */
@Getter
@Builder
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class Notification {

    private final Long id;
    private final Long userId;
    private final NotificationType type;
    private final String title;
    private final String message;
    private final Long vocId;
    @Builder.Default
    private boolean read = false;
    private final LocalDateTime createdAt;

    public static Notification create(Long userId, NotificationType type, String title, String message, Long vocId) {
        return Notification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .vocId(vocId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    public void markAsRead() {
        this.read = true;
    }
}
