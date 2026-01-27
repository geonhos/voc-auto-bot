package com.geonho.vocautobot.application.statistics.port.in;

import com.geonho.vocautobot.application.statistics.port.in.dto.CategoryStatsResult;

/**
 * 카테고리별 통계 조회 UseCase.
 */
public interface GetCategoryStatsUseCase {

    /**
     * 카테고리별 VOC 통계를 조회합니다.
     * - 카테고리명
     * - VOC 건수
     * - 전체 대비 비율(%)
     *
     * @return 카테고리별 통계 결과
     */
    CategoryStatsResult getCategoryStats();
}
