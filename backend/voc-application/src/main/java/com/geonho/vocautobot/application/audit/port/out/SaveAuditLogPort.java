package com.geonho.vocautobot.application.audit.port.out;

import com.geonho.vocautobot.domain.audit.AuditLog;

public interface SaveAuditLogPort {

    void save(AuditLog auditLog);
}
