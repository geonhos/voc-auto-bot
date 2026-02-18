package com.geonho.vocautobot.application.kpi.port.out;

import com.geonho.vocautobot.domain.kpi.KpiSnapshot;

/**
 * KPI 스냅샷 저장 포트.
 */
public interface SaveKpiSnapshotPort {

    KpiSnapshot save(KpiSnapshot snapshot);
}
