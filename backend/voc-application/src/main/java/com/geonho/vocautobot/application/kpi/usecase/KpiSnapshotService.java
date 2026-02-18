package com.geonho.vocautobot.application.kpi.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.kpi.port.in.KpiSnapshotUseCase;
import com.geonho.vocautobot.application.kpi.port.out.LoadKpiSnapshotPort;
import com.geonho.vocautobot.application.kpi.port.out.SaveKpiSnapshotPort;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import com.geonho.vocautobot.domain.kpi.KpiSnapshot;
import com.geonho.vocautobot.domain.voc.VocPriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * KPI 일일 스냅샷 배치 서비스.
 */
@Slf4j
@UseCase
@RequiredArgsConstructor
public class KpiSnapshotService implements KpiSnapshotUseCase {

    private final StatisticsQueryPort statisticsQueryPort;
    private final SaveKpiSnapshotPort saveKpiSnapshotPort;
    private final LoadKpiSnapshotPort loadKpiSnapshotPort;

    @Override
    @Scheduled(cron = "0 0 1 * * *")
    public void createDailySnapshot() {
        LocalDate yesterday = LocalDate.now().minusDays(1);

        if (loadKpiSnapshotPort.findByDate(yesterday).isPresent()) {
            log.info("KPI snapshot for {} already exists, skipping", yesterday);
            return;
        }

        log.info("Creating KPI daily snapshot for {}", yesterday);

        long totalVocs = statisticsQueryPort.countTotalVocs();
        long resolvedVocs = statisticsQueryPort.countResolvedVocs();
        double avgResolutionHours = statisticsQueryPort.calculateAverageProcessingTimeInHours();

        LocalDateTime dayStart = yesterday.atStartOfDay();
        long todayVocs = statisticsQueryPort.countVocsSince(dayStart);

        // 카테고리별 통계
        Map<Long, Long> categoryRaw = statisticsQueryPort.countVocsByCategory();
        Map<String, Long> categoryStats = new HashMap<>();
        categoryRaw.forEach((k, v) -> categoryStats.put(String.valueOf(k), v));

        // 우선순위별 통계
        Map<VocPriority, Long> priorityRaw = statisticsQueryPort.countVocsByPriority();
        Map<String, Long> priorityStats = new HashMap<>();
        priorityRaw.forEach((k, v) -> priorityStats.put(k.name(), v));

        KpiSnapshot snapshot = KpiSnapshot.create(
                yesterday, totalVocs, todayVocs, resolvedVocs,
                avgResolutionHours, categoryStats, priorityStats
        );

        saveKpiSnapshotPort.save(snapshot);
        log.info("KPI daily snapshot created for {}: totalVocs={}, todayVocs={}, resolvedVocs={}",
                yesterday, totalVocs, todayVocs, resolvedVocs);
    }

    @Override
    public List<KpiSnapshot> getSnapshotTrend(int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);
        return loadKpiSnapshotPort.findByDateRange(startDate, endDate);
    }
}
