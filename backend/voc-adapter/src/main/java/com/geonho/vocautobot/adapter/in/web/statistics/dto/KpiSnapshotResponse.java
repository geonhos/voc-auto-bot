package com.geonho.vocautobot.adapter.in.web.statistics.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.geonho.vocautobot.domain.kpi.KpiSnapshot;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.util.Map;

@Getter
@Builder
public class KpiSnapshotResponse {

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate snapshotDate;
    private long totalVocs;
    private long todayVocs;
    private long resolvedVocs;
    private Double avgResolutionHours;
    private Map<String, Long> categoryStats;
    private Map<String, Long> priorityStats;

    public static KpiSnapshotResponse from(KpiSnapshot snapshot) {
        return KpiSnapshotResponse.builder()
                .snapshotDate(snapshot.snapshotDate())
                .totalVocs(snapshot.totalVocs())
                .todayVocs(snapshot.todayVocs())
                .resolvedVocs(snapshot.resolvedVocs())
                .avgResolutionHours(snapshot.avgResolutionHours())
                .categoryStats(snapshot.categoryStats())
                .priorityStats(snapshot.priorityStats())
                .build();
    }
}
