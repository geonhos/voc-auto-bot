package com.geonho.vocautobot.application.statistics.port.in.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 트렌드 데이터 조회 결과 DTO.
 */
public record TrendResult(
        List<TrendDataPoint> dataPoints
) {
    public record TrendDataPoint(
            LocalDate date,
            long count
    ) {
        public static TrendDataPoint of(LocalDate date, long count) {
            return new TrendDataPoint(date, count);
        }
    }
}
