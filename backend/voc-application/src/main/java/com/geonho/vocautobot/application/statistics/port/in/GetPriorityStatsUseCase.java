package com.geonho.vocautobot.application.statistics.port.in;

import com.geonho.vocautobot.application.statistics.port.in.dto.PriorityStatsResult;

/**
 * 우선순위별 통계 조회 UseCase.
 */
public interface GetPriorityStatsUseCase {

    /**
     * 우선순위별 VOC 통계를 조회합니다.
     * - 우선순위
     * - VOC 건수
     *
     * @return 우선순위별 통계 결과
     */
    PriorityStatsResult getPriorityStats();
}
