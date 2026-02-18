package com.geonho.vocautobot.application.kpi.port.in;

import com.geonho.vocautobot.domain.kpi.KpiSnapshot;

import java.util.List;

/**
 * KPI 스냅샷 UseCase.
 */
public interface KpiSnapshotUseCase {

    /**
     * 일일 KPI 스냅샷을 생성합니다.
     */
    void createDailySnapshot();

    /**
     * 최근 N일간의 KPI 트렌드를 조회합니다.
     *
     * @param days 조회 일수
     * @return 일별 KPI 스냅샷 목록
     */
    List<KpiSnapshot> getSnapshotTrend(int days);
}
