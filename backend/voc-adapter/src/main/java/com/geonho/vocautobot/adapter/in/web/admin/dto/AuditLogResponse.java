package com.geonho.vocautobot.adapter.in.web.admin.dto;

import com.geonho.vocautobot.domain.audit.AuditLog;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class AuditLogResponse {

    private final Long id;
    private final Long userId;
    private final String username;
    private final String action;
    private final String entityType;
    private final String entityId;
    private final String beforeData;
    private final String afterData;
    private final String ipAddress;
    private final String userAgent;
    private final LocalDateTime createdAt;

    public static AuditLogResponse from(AuditLog auditLog) {
        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .userId(auditLog.getUserId())
                .username(auditLog.getUsername())
                .action(auditLog.getAction().name())
                .entityType(auditLog.getEntityType().name())
                .entityId(auditLog.getEntityId())
                .beforeData(auditLog.getBeforeData())
                .afterData(auditLog.getAfterData())
                .ipAddress(auditLog.getIpAddress())
                .userAgent(auditLog.getUserAgent())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
