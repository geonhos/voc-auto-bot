package com.geonho.vocautobot.application.notification.port.out;

import com.geonho.vocautobot.domain.notification.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LoadNotificationPort {

    Page<Notification> loadByUserId(Long userId, Pageable pageable);

    long countUnread(Long userId);
}
