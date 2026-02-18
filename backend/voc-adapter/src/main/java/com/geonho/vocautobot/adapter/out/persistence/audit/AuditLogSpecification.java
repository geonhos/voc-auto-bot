package com.geonho.vocautobot.adapter.out.persistence.audit;

import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;

public class AuditLogSpecification {

    private AuditLogSpecification() {}

    public static Specification<AuditLogJpaEntity> withFilters(
            Long userId,
            String action,
            String entityType,
            String entityId,
            LocalDateTime startDate,
            LocalDateTime endDate
    ) {
        return Specification.where(hasUserId(userId))
                .and(hasAction(action))
                .and(hasEntityType(entityType))
                .and(hasEntityId(entityId))
                .and(createdAfter(startDate))
                .and(createdBefore(endDate));
    }

    private static Specification<AuditLogJpaEntity> hasUserId(Long userId) {
        if (userId == null) return null;
        return (root, query, cb) -> cb.equal(root.get("userId"), userId);
    }

    private static Specification<AuditLogJpaEntity> hasAction(String action) {
        if (action == null || action.isBlank()) return null;
        return (root, query, cb) -> cb.equal(root.get("action"), action);
    }

    private static Specification<AuditLogJpaEntity> hasEntityType(String entityType) {
        if (entityType == null || entityType.isBlank()) return null;
        return (root, query, cb) -> cb.equal(root.get("entityType"), entityType);
    }

    private static Specification<AuditLogJpaEntity> hasEntityId(String entityId) {
        if (entityId == null || entityId.isBlank()) return null;
        return (root, query, cb) -> cb.equal(root.get("entityId"), entityId);
    }

    private static Specification<AuditLogJpaEntity> createdAfter(LocalDateTime startDate) {
        if (startDate == null) return null;
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), startDate);
    }

    private static Specification<AuditLogJpaEntity> createdBefore(LocalDateTime endDate) {
        if (endDate == null) return null;
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), endDate);
    }
}
