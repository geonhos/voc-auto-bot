package com.geonho.vocautobot.adapter.in.web.statistics.dto;

import com.geonho.vocautobot.application.statistics.port.in.dto.PriorityStatsResult;
import com.geonho.vocautobot.domain.voc.VocPriority;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 우선순위별 통계 조회 응답 DTO.
 */
@Getter
@Builder
public class PriorityStatsResponse {

    private List<PriorityStat> stats;

    @Getter
    @Builder
    public static class PriorityStat {
        private VocPriority priority;
        private String priorityDisplayName;
        private long count;

        public static PriorityStat from(PriorityStatsResult.PriorityStat stat) {
            return PriorityStat.builder()
                    .priority(stat.priority())
                    .priorityDisplayName(stat.priorityDisplayName())
                    .count(stat.count())
                    .build();
        }
    }

    public static PriorityStatsResponse from(PriorityStatsResult result) {
        List<PriorityStat> stats = result.stats().stream()
                .map(PriorityStat::from)
                .collect(Collectors.toList());

        return PriorityStatsResponse.builder()
                .stats(stats)
                .build();
    }
}
