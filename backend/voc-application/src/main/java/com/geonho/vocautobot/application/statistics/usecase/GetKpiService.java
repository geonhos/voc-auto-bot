package com.geonho.vocautobot.application.statistics.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetKpiUseCase;
import com.geonho.vocautobot.application.statistics.port.in.dto.KpiResult;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * KPI 조회 서비스 구현체.
 */
@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetKpiService implements GetKpiUseCase {

    private final StatisticsQueryPort statisticsQueryPort;

    @Override
    public KpiResult getKpi() {
        long totalVocs = statisticsQueryPort.countTotalVocs();
        long processedVocs = statisticsQueryPort.countProcessedVocs();
        double avgProcessingTime = statisticsQueryPort.calculateAverageProcessingTimeInHours();
        long resolvedVocs = statisticsQueryPort.countResolvedVocs();

        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime weekStart = LocalDate.now().minusDays(6).atStartOfDay();
        LocalDateTime monthStart = LocalDate.now().minusDays(29).atStartOfDay();

        long todayVocs = statisticsQueryPort.countVocsSince(todayStart);
        long weekVocs = statisticsQueryPort.countVocsSince(weekStart);
        long monthVocs = statisticsQueryPort.countVocsSince(monthStart);

        return KpiResult.of(totalVocs, processedVocs, avgProcessingTime,
                todayVocs, weekVocs, monthVocs, resolvedVocs);
    }
}
