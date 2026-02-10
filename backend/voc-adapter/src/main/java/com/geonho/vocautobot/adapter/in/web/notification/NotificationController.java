package com.geonho.vocautobot.adapter.in.web.notification;

import com.geonho.vocautobot.adapter.common.ApiResponse;
import com.geonho.vocautobot.adapter.in.web.notification.dto.NotificationResponse;
import com.geonho.vocautobot.adapter.out.sse.SseEmitterManager;
import com.geonho.vocautobot.application.notification.usecase.NotificationService;
import com.geonho.vocautobot.domain.notification.Notification;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@Slf4j
@Tag(name = "Notifications", description = "알림 API")
@RestController
@RequestMapping("/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterManager sseEmitterManager;

    @Value("${security.enabled:true}")
    private boolean securityEnabled;

    private static final Long DEV_DEFAULT_USER_ID = 1L;

    @Operation(summary = "SSE 스트림 연결", description = "실시간 알림을 받기 위한 SSE 연결")
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam(required = false) Long userId) {
        Long resolvedUserId = resolveUserId(userId);
        log.info("SSE stream requested for user: {}", resolvedUserId);
        return sseEmitterManager.createEmitter(resolvedUserId);
    }

    @Operation(summary = "알림 목록 조회", description = "페이징 적용 알림 목록")
    @GetMapping
    public ApiResponse<List<NotificationResponse>> getNotifications(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Long resolvedUserId = resolveUserId(userId);
        Page<Notification> notifications = notificationService.getNotifications(
                resolvedUserId, PageRequest.of(page, size));

        List<NotificationResponse> response = notifications.getContent().stream()
                .map(NotificationResponse::from)
                .toList();

        return ApiResponse.success(
                response,
                notifications.getNumber(),
                notifications.getSize(),
                notifications.getTotalElements(),
                notifications.getTotalPages()
        );
    }

    @Operation(summary = "읽지 않은 알림 수 조회")
    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount(@RequestParam(required = false) Long userId) {
        Long resolvedUserId = resolveUserId(userId);
        return ApiResponse.success(notificationService.getUnreadCount(resolvedUserId));
    }

    @Operation(summary = "알림 읽음 처리")
    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ApiResponse.success(null);
    }

    @Operation(summary = "전체 읽음 처리")
    @PatchMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(@RequestParam(required = false) Long userId) {
        Long resolvedUserId = resolveUserId(userId);
        notificationService.markAllAsRead(resolvedUserId);
        return ApiResponse.success(null);
    }

    private Long resolveUserId(Long userId) {
        if (!securityEnabled) {
            return userId != null ? userId : DEV_DEFAULT_USER_ID;
        }
        // In production, get userId from SecurityContext
        // For now, fall back to parameter or default
        return userId != null ? userId : DEV_DEFAULT_USER_ID;
    }
}
