package com.geonho.vocautobot.application.statistics.port.out;

import com.geonho.vocautobot.domain.voc.VocPriority;

import java.time.LocalDate;
import java.util.Map;

/**
 * 통계 조회를 위한 포트 인터페이스.
 * Infrastructure 계층에서 구현되어 통계 데이터를 제공합니다.
 */
public interface StatisticsQueryPort {

    /**
     * 전체 VOC 건수를 조회합니다.
     *
     * @return 전체 VOC 건수
     */
    long countTotalVocs();

    /**
     * 처리 완료된 VOC 건수를 조회합니다.
     *
     * @return 처리 완료된 VOC 건수 (RESOLVED, CLOSED 상태)
     */
    long countProcessedVocs();

    /**
     * VOC의 평균 처리 시간(시간 단위)을 조회합니다.
     *
     * @return 평균 처리 시간(시간). 처리된 VOC가 없으면 0.0
     */
    double calculateAverageProcessingTimeInHours();

    /**
     * 일자별 VOC 발생 건수를 조회합니다.
     *
     * @param startDate 시작일
     * @param endDate 종료일
     * @return 일자별 VOC 건수 맵 (Key: 날짜, Value: 건수)
     */
    Map<LocalDate, Long> countVocsByDateRange(LocalDate startDate, LocalDate endDate);

    /**
     * 카테고리별 VOC 건수를 조회합니다.
     *
     * @return 카테고리 ID별 VOC 건수 맵
     */
    Map<Long, Long> countVocsByCategory();

    /**
     * 우선순위별 VOC 건수를 조회합니다.
     *
     * @return 우선순위별 VOC 건수 맵
     */
    Map<VocPriority, Long> countVocsByPriority();
}
