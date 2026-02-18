package com.geonho.vocautobot.application.audit.usecase;

import com.geonho.vocautobot.application.audit.port.in.GetAuditLogsUseCase;
import com.geonho.vocautobot.application.audit.port.out.LoadAuditLogPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.domain.audit.AuditAction;
import com.geonho.vocautobot.domain.audit.AuditEntityType;
import com.geonho.vocautobot.domain.audit.AuditLog;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService implements GetAuditLogsUseCase {

    private final LoadAuditLogPort loadAuditLogPort;

    @Override
    public Page<AuditLog> getAuditLogs(
            Long userId,
            AuditAction action,
            AuditEntityType entityType,
            String entityId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    ) {
        return loadAuditLogPort.loadAuditLogs(userId, action, entityType, entityId, startDate, endDate, pageable);
    }
}
