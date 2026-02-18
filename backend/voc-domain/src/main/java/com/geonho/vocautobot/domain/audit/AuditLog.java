package com.geonho.vocautobot.domain.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AuditLog {

    private final Long id;
    private final Long userId;
    private final String username;
    private final AuditAction action;
    private final AuditEntityType entityType;
    private final String entityId;
    private final String beforeData;
    private final String afterData;
    private final String ipAddress;
    private final String userAgent;
    private final LocalDateTime createdAt;

    public static AuditLog create(
            Long userId,
            String username,
            AuditAction action,
            AuditEntityType entityType,
            String entityId,
            String beforeData,
            String afterData,
            String ipAddress,
            String userAgent
    ) {
        return AuditLog.builder()
                .userId(userId)
                .username(username)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .beforeData(beforeData)
                .afterData(afterData)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
