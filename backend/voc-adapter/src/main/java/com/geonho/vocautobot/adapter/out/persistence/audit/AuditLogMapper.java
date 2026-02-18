package com.geonho.vocautobot.adapter.out.persistence.audit;

import com.geonho.vocautobot.domain.audit.AuditAction;
import com.geonho.vocautobot.domain.audit.AuditEntityType;
import com.geonho.vocautobot.domain.audit.AuditLog;
import org.springframework.stereotype.Component;

@Component
public class AuditLogMapper {

    public AuditLogJpaEntity toEntity(AuditLog domain) {
        if (domain == null) return null;

        return new AuditLogJpaEntity(
                domain.getUserId(),
                domain.getUsername(),
                domain.getAction().name(),
                domain.getEntityType().name(),
                domain.getEntityId(),
                domain.getBeforeData(),
                domain.getAfterData(),
                domain.getIpAddress(),
                domain.getUserAgent(),
                domain.getCreatedAt()
        );
    }

    public AuditLog toDomain(AuditLogJpaEntity entity) {
        if (entity == null) return null;

        return AuditLog.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .username(entity.getUsername())
                .action(AuditAction.valueOf(entity.getAction()))
                .entityType(AuditEntityType.valueOf(entity.getEntityType()))
                .entityId(entity.getEntityId())
                .beforeData(entity.getBeforeData())
                .afterData(entity.getAfterData())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
