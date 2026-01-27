package com.geonho.vocautobot.application.statistics.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetTrendUseCase;
import com.geonho.vocautobot.application.statistics.port.in.dto.TrendResult;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * VOC 트렌드 조회 서비스 구현체.
 */
@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetTrendService implements GetTrendUseCase {

    private final StatisticsQueryPort statisticsQueryPort;

    @Override
    public TrendResult getTrend(LocalDate startDate, LocalDate endDate) {
        Map<LocalDate, Long> vocCounts = statisticsQueryPort.countVocsByDateRange(startDate, endDate);

        List<TrendResult.TrendDataPoint> dataPoints = new ArrayList<>();

        // 기간 내 모든 날짜에 대해 데이터 포인트 생성 (데이터가 없는 날은 0으로 표시)
        LocalDate currentDate = startDate;
        while (!currentDate.isAfter(endDate)) {
            long count = vocCounts.getOrDefault(currentDate, 0L);
            dataPoints.add(TrendResult.TrendDataPoint.of(currentDate, count));
            currentDate = currentDate.plusDays(1);
        }

        return new TrendResult(dataPoints);
    }

    @Override
    public TrendResult getRecentTrend() {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(29); // 오늘 포함 30일

        return getTrend(startDate, endDate);
    }
}
