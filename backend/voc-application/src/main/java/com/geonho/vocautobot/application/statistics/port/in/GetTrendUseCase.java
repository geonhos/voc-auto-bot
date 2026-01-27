package com.geonho.vocautobot.application.statistics.port.in;

import com.geonho.vocautobot.application.statistics.port.in.dto.TrendResult;

import java.time.LocalDate;

/**
 * VOC 트렌드 데이터 조회 UseCase.
 */
public interface GetTrendUseCase {

    /**
     * 지정된 기간 동안의 일별 VOC 추이를 조회합니다.
     *
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 일별 VOC 추이 데이터
     */
    TrendResult getTrend(LocalDate startDate, LocalDate endDate);

    /**
     * 최근 30일간의 일별 VOC 추이를 조회합니다.
     *
     * @return 일별 VOC 추이 데이터
     */
    TrendResult getRecentTrend();
}
