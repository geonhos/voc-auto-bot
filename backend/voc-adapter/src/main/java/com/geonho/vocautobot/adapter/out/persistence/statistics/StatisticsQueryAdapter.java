package com.geonho.vocautobot.adapter.out.persistence.statistics;

import com.geonho.vocautobot.adapter.out.persistence.voc.VocJpaEntity;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import com.geonho.vocautobot.domain.voc.VocPriority;
import com.geonho.vocautobot.domain.voc.VocStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class StatisticsQueryAdapter implements StatisticsQueryPort {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public long countTotalVocs() {
        TypedQuery<Long> query = entityManager.createQuery(
                "SELECT COUNT(v) FROM VocJpaEntity v", Long.class);
        return query.getSingleResult();
    }

    @Override
    public long countProcessedVocs() {
        TypedQuery<Long> query = entityManager.createQuery(
                "SELECT COUNT(v) FROM VocJpaEntity v WHERE v.status IN (:statuses)", Long.class);
        query.setParameter("statuses", List.of(VocStatus.RESOLVED, VocStatus.CLOSED));
        return query.getSingleResult();
    }

    @Override
    public double calculateAverageProcessingTimeInHours() {
        TypedQuery<VocJpaEntity> query = entityManager.createQuery(
                "SELECT v FROM VocJpaEntity v WHERE v.status IN (:statuses) AND v.resolvedAt IS NOT NULL",
                VocJpaEntity.class);
        query.setParameter("statuses", List.of(VocStatus.RESOLVED, VocStatus.CLOSED));

        List<VocJpaEntity> completedVocs = query.getResultList();

        if (completedVocs.isEmpty()) {
            return 0.0;
        }

        double totalHours = 0;
        for (VocJpaEntity voc : completedVocs) {
            LocalDateTime createdAt = voc.getCreatedAt();
            LocalDateTime resolvedAt = voc.getResolvedAt();
            if (createdAt != null && resolvedAt != null) {
                long minutes = ChronoUnit.MINUTES.between(createdAt, resolvedAt);
                totalHours += minutes / 60.0;
            }
        }

        return totalHours / completedVocs.size();
    }

    @Override
    public Map<LocalDate, Long> countVocsByDateRange(LocalDate startDate, LocalDate endDate) {
        TypedQuery<Object[]> query = entityManager.createQuery(
                "SELECT CAST(v.createdAt AS date), COUNT(v) FROM VocJpaEntity v " +
                        "WHERE CAST(v.createdAt AS date) BETWEEN :startDate AND :endDate " +
                        "GROUP BY CAST(v.createdAt AS date) " +
                        "ORDER BY CAST(v.createdAt AS date)",
                Object[].class);
        query.setParameter("startDate", startDate);
        query.setParameter("endDate", endDate);

        Map<LocalDate, Long> result = new HashMap<>();
        List<Object[]> results = query.getResultList();

        for (Object[] row : results) {
            LocalDate date = (LocalDate) row[0];
            Long count = (Long) row[1];
            result.put(date, count);
        }

        // Fill missing dates with 0
        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            result.putIfAbsent(current, 0L);
            current = current.plusDays(1);
        }

        return result;
    }

    @Override
    public Map<Long, Long> countVocsByCategory() {
        TypedQuery<Object[]> query = entityManager.createQuery(
                "SELECT v.categoryId, COUNT(v) FROM VocJpaEntity v " +
                        "GROUP BY v.categoryId",
                Object[].class);

        Map<Long, Long> result = new HashMap<>();
        List<Object[]> results = query.getResultList();

        for (Object[] row : results) {
            Long categoryId = (Long) row[0];
            Long count = (Long) row[1];
            if (categoryId != null) {
                result.put(categoryId, count);
            }
        }

        return result;
    }

    @Override
    public Map<VocPriority, Long> countVocsByPriority() {
        TypedQuery<Object[]> query = entityManager.createQuery(
                "SELECT v.priority, COUNT(v) FROM VocJpaEntity v " +
                        "GROUP BY v.priority",
                Object[].class);

        Map<VocPriority, Long> result = new HashMap<>();
        List<Object[]> results = query.getResultList();

        for (Object[] row : results) {
            VocPriority priority = (VocPriority) row[0];
            Long count = (Long) row[1];
            result.put(priority, count);
        }

        // Initialize all priorities with 0 if not present
        for (VocPriority priority : VocPriority.values()) {
            result.putIfAbsent(priority, 0L);
        }

        return result;
    }
}
