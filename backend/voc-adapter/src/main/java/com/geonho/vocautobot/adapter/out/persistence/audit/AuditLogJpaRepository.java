package com.geonho.vocautobot.adapter.out.persistence.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface AuditLogJpaRepository extends JpaRepository<AuditLogJpaEntity, Long>,
        JpaSpecificationExecutor<AuditLogJpaEntity> {
}
