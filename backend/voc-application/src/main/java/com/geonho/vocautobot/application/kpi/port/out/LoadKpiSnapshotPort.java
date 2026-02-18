package com.geonho.vocautobot.application.kpi.port.out;

import com.geonho.vocautobot.domain.kpi.KpiSnapshot;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * KPI 스냅샷 조회 포트.
 */
public interface LoadKpiSnapshotPort {

    Optional<KpiSnapshot> findByDate(LocalDate date);

    List<KpiSnapshot> findByDateRange(LocalDate startDate, LocalDate endDate);
}
