package com.geonho.vocautobot.adapter.out.persistence.notification;

import com.geonho.vocautobot.application.notification.port.out.LoadNotificationPort;
import com.geonho.vocautobot.application.notification.port.out.SaveNotificationPort;
import com.geonho.vocautobot.domain.notification.Notification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class NotificationPersistenceAdapter implements SaveNotificationPort, LoadNotificationPort {

    private final NotificationJpaRepository repository;

    @Override
    @Transactional
    public Notification save(Notification notification) {
        NotificationJpaEntity entity = new NotificationJpaEntity(
                notification.getUserId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getVocId()
        );
        NotificationJpaEntity saved = repository.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        repository.findById(notificationId).ifPresent(entity -> {
            entity.markAsRead();
            repository.save(entity);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        repository.markAllAsReadByUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Notification> loadByUserId(Long userId, Pageable pageable) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return repository.countByUserIdAndReadFalse(userId);
    }

    private Notification toDomain(NotificationJpaEntity entity) {
        return Notification.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .type(entity.getType())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .vocId(entity.getVocId())
                .read(entity.isRead())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
