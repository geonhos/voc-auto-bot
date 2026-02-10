package com.geonho.vocautobot.adapter.out.sse;

import com.geonho.vocautobot.application.notification.port.out.SseEmitterPort;
import com.geonho.vocautobot.domain.notification.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SSE 이미터 관리자 - 스레드 안전한 ConcurrentHashMap 사용
 */
@Slf4j
@Component
public class SseEmitterManager implements SseEmitterPort {

    private static final long SSE_TIMEOUT = 30 * 60 * 1000L; // 30분

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter createEmitter(Long userId) {
        // 기존 이미터가 있으면 제거
        removeEmitter(userId);

        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitter.onCompletion(() -> {
            log.debug("SSE connection completed for user: {}", userId);
            emitters.remove(userId);
        });

        emitter.onTimeout(() -> {
            log.debug("SSE connection timed out for user: {}", userId);
            emitters.remove(userId);
        });

        emitter.onError(e -> {
            log.debug("SSE connection error for user {}: {}", userId, e.getMessage());
            emitters.remove(userId);
        });

        emitters.put(userId, emitter);

        // 초기 연결 확인 이벤트 전송
        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("connected"));
        } catch (IOException e) {
            log.warn("Failed to send connect event to user {}: {}", userId, e.getMessage());
            emitters.remove(userId);
        }

        log.info("SSE emitter created for user: {}", userId);
        return emitter;
    }

    @Override
    public void sendToUser(Long userId, Notification notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter == null) {
            log.debug("No active SSE connection for user: {}", userId);
            return;
        }

        try {
            emitter.send(SseEmitter.event()
                    .name("notification")
                    .data(Map.of(
                            "id", notification.getId(),
                            "type", notification.getType().name(),
                            "title", notification.getTitle(),
                            "message", notification.getMessage(),
                            "vocId", notification.getVocId() != null ? notification.getVocId() : "",
                            "read", notification.isRead(),
                            "createdAt", notification.getCreatedAt().toString()
                    )));
        } catch (IOException e) {
            log.warn("Failed to send SSE to user {}: {}", userId, e.getMessage());
            emitters.remove(userId);
        }
    }

    @Override
    public void removeEmitter(Long userId) {
        SseEmitter emitter = emitters.remove(userId);
        if (emitter != null) {
            try {
                emitter.complete();
            } catch (Exception e) {
                log.debug("Error completing emitter for user {}: {}", userId, e.getMessage());
            }
        }
    }
}
