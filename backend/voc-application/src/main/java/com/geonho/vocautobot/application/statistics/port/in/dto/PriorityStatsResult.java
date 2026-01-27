package com.geonho.vocautobot.application.statistics.port.in.dto;

import com.geonho.vocautobot.domain.voc.VocPriority;

import java.util.List;

/**
 * 우선순위별 통계 조회 결과 DTO.
 */
public record PriorityStatsResult(
        List<PriorityStat> stats
) {
    public record PriorityStat(
            VocPriority priority,
            String priorityDisplayName,
            long count
    ) {
        public static PriorityStat of(VocPriority priority, long count) {
            return new PriorityStat(
                    priority,
                    priority.getDisplayName(),
                    count
            );
        }
    }
}
