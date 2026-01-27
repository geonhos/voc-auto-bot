package com.geonho.vocautobot.application.statistics.usecase;

import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetPriorityStatsUseCase;
import com.geonho.vocautobot.application.statistics.port.in.dto.PriorityStatsResult;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import com.geonho.vocautobot.domain.voc.VocPriority;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 우선순위별 통계 조회 서비스 구현체.
 */
@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetPriorityStatsService implements GetPriorityStatsUseCase {

    private final StatisticsQueryPort statisticsQueryPort;

    @Override
    public PriorityStatsResult getPriorityStats() {
        Map<VocPriority, Long> vocCountsByPriority = statisticsQueryPort.countVocsByPriority();

        List<PriorityStatsResult.PriorityStat> stats = new ArrayList<>();

        // 모든 우선순위에 대해 통계 생성 (데이터가 없으면 0으로 표시)
        for (VocPriority priority : VocPriority.values()) {
            long count = vocCountsByPriority.getOrDefault(priority, 0L);
            stats.add(PriorityStatsResult.PriorityStat.of(priority, count));
        }

        // 우선순위 레벨 순으로 정렬 (긴급 -> 높음 -> 보통 -> 낮음)
        stats.sort((a, b) -> Integer.compare(a.priority().getLevel(), b.priority().getLevel()));

        return new PriorityStatsResult(stats);
    }
}
