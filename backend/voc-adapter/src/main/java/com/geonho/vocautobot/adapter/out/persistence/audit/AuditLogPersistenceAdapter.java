package com.geonho.vocautobot.adapter.out.persistence.audit;

import com.geonho.vocautobot.application.audit.port.out.LoadAuditLogPort;
import com.geonho.vocautobot.application.audit.port.out.SaveAuditLogPort;
import com.geonho.vocautobot.domain.audit.AuditAction;
import com.geonho.vocautobot.domain.audit.AuditEntityType;
import com.geonho.vocautobot.domain.audit.AuditLog;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class AuditLogPersistenceAdapter implements SaveAuditLogPort, LoadAuditLogPort {

    private final AuditLogJpaRepository auditLogJpaRepository;
    private final AuditLogMapper auditLogMapper;

    @Override
    public void save(AuditLog auditLog) {
        AuditLogJpaEntity entity = auditLogMapper.toEntity(auditLog);
        auditLogJpaRepository.save(entity);
    }

    @Override
    public Page<AuditLog> loadAuditLogs(
            Long userId,
            AuditAction action,
            AuditEntityType entityType,
            String entityId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        Specification<AuditLogJpaEntity> spec = AuditLogSpecification.withFilters(
                userId,
                action != null ? action.name() : null,
                entityType != null ? entityType.name() : null,
                entityId,
                startDate,
                endDate
        );

        return auditLogJpaRepository.findAll(spec, pageable)
                .map(auditLogMapper::toDomain);
    }
}
