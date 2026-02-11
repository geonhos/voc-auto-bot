package com.geonho.vocautobot.adapter.out.persistence.notification;

import com.geonho.vocautobot.adapter.out.persistence.common.BaseJpaEntity;
import com.geonho.vocautobot.domain.notification.NotificationType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user_id", columnList = "user_id"),
    @Index(name = "idx_notification_read", columnList = "user_id, is_read")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NotificationJpaEntity extends BaseJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "voc_id")
    private Long vocId;

    @Column(name = "is_read", nullable = false)
    private boolean read;

    public NotificationJpaEntity(Long userId, NotificationType type, String title,
                                  String message, Long vocId) {
        this.userId = userId;
        this.type = type;
        this.title = title;
        this.message = message;
        this.vocId = vocId;
        this.read = false;
    }

    public void markAsRead() {
        this.read = true;
    }
}
