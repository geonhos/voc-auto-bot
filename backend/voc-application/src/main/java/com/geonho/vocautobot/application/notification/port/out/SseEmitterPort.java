package com.geonho.vocautobot.application.notification.port.out;

import com.geonho.vocautobot.domain.notification.Notification;

/**
 * SSE 이미터 관리 포트 (프레임워크 비의존)
 */
public interface SseEmitterPort {

    void sendToUser(Long userId, Notification notification);

    void broadcastAll(Notification notification);

    void removeEmitter(Long userId);
}
