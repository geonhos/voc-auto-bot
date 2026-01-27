package com.geonho.vocautobot.adapter.in.web.statistics.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.geonho.vocautobot.application.statistics.port.in.dto.TrendResult;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 트렌드 조회 응답 DTO.
 */
@Getter
@Builder
public class TrendResponse {

    private List<TrendDataPoint> dataPoints;

    @Getter
    @Builder
    public static class TrendDataPoint {
        @JsonFormat(pattern = "yyyy-MM-dd")
        private LocalDate date;
        private long count;

        public static TrendDataPoint from(TrendResult.TrendDataPoint dataPoint) {
            return TrendDataPoint.builder()
                    .date(dataPoint.date())
                    .count(dataPoint.count())
                    .build();
        }
    }

    public static TrendResponse from(TrendResult result) {
        List<TrendDataPoint> dataPoints = result.dataPoints().stream()
                .map(TrendDataPoint::from)
                .collect(Collectors.toList());

        return TrendResponse.builder()
                .dataPoints(dataPoints)
                .build();
    }
}
