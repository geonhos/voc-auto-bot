package com.geonho.vocautobot.domain.kpi;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * KPI 일일 스냅샷 도메인 모델.
 */
public record KpiSnapshot(
        Long id,
        LocalDate snapshotDate,
        long totalVocs,
        long todayVocs,
        long resolvedVocs,
        Double avgResolutionHours,
        Map<String, Long> categoryStats,
        Map<String, Long> priorityStats,
        LocalDateTime createdAt
) {
    public static KpiSnapshot create(LocalDate snapshotDate, long totalVocs, long todayVocs,
                                      long resolvedVocs, Double avgResolutionHours,
                                      Map<String, Long> categoryStats,
                                      Map<String, Long> priorityStats) {
        return new KpiSnapshot(null, snapshotDate, totalVocs, todayVocs, resolvedVocs,
                avgResolutionHours, categoryStats, priorityStats, LocalDateTime.now());
    }
}
