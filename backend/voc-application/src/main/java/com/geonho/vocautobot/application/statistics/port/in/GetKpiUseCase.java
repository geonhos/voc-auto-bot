package com.geonho.vocautobot.application.statistics.port.in;

import com.geonho.vocautobot.application.statistics.port.in.dto.KpiResult;

/**
 * KPI(핵심성과지표) 조회 UseCase.
 */
public interface GetKpiUseCase {

    /**
     * VOC 처리 KPI를 조회합니다.
     * - 총 VOC 수
     * - 처리율 (%)
     * - 평균 처리 시간 (시간)
     *
     * @return KPI 조회 결과
     */
    KpiResult getKpi();
}
