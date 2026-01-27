package com.geonho.vocautobot.application.statistics.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetKpiUseCase;
import com.geonho.vocautobot.application.statistics.port.in.dto.KpiResult;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

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

        return KpiResult.of(totalVocs, processedVocs, avgProcessingTime);
    }
}
