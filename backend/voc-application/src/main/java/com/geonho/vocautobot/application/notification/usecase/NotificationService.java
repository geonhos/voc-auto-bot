package com.geonho.vocautobot.application.notification.usecase;

import com.geonho.vocautobot.application.notification.port.out.LoadNotificationPort;
import com.geonho.vocautobot.application.notification.port.out.SaveNotificationPort;
import com.geonho.vocautobot.application.notification.port.out.SseEmitterPort;
import com.geonho.vocautobot.domain.notification.Notification;
import com.geonho.vocautobot.domain.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 알림 서비스 - 알림 저장 + SSE 실시간 전달
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final SaveNotificationPort saveNotificationPort;
    private final LoadNotificationPort loadNotificationPort;
    private final SseEmitterPort sseEmitterPort;

    /**
     * 알림 전송 (저장 + SSE)
     */
    @Transactional
    public void send(Long userId, NotificationType type, String title, String message, Long vocId) {
        Notification notification = Notification.create(userId, type, title, message, vocId);
        Notification saved = saveNotificationPort.save(notification);

        try {
            sseEmitterPort.sendToUser(userId, saved);
        } catch (Exception e) {
            log.warn("Failed to send SSE notification to user {}: {}", userId, e.getMessage());
        }
    }

    /**
     * 모든 사용자에게 알림 전송 (브로드캐스트용)
     */
    @Transactional
    public void broadcast(NotificationType type, String title, String message, Long vocId) {
        // 간소화: userId=null로 저장하고 SSE는 생략
        // 실제 구현에서는 모든 접속 사용자에게 전달
        Notification notification = Notification.create(null, type, title, message, vocId);
        saveNotificationPort.save(notification);
    }

    @Transactional(readOnly = true)
    public Page<Notification> getNotifications(Long userId, Pageable pageable) {
        return loadNotificationPort.loadByUserId(userId, pageable);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return loadNotificationPort.countUnread(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        saveNotificationPort.markAsRead(notificationId);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        saveNotificationPort.markAllAsRead(userId);
    }
}
