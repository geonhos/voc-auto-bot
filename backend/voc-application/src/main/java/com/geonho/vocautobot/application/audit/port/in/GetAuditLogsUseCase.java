package com.geonho.vocautobot.application.audit.port.in;

import com.geonho.vocautobot.domain.audit.AuditAction;
import com.geonho.vocautobot.domain.audit.AuditEntityType;
import com.geonho.vocautobot.domain.audit.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface GetAuditLogsUseCase {

    Page<AuditLog> getAuditLogs(
            Long userId,
            AuditAction action,
            AuditEntityType entityType,
            String entityId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );
}
