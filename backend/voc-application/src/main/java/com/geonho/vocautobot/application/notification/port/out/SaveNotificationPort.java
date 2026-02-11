package com.geonho.vocautobot.application.notification.port.out;

import com.geonho.vocautobot.domain.notification.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SaveNotificationPort {

    Notification save(Notification notification);

    void markAsRead(Long notificationId);

    void markAllAsRead(Long userId);
}
