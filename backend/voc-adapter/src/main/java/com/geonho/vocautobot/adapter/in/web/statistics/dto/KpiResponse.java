package com.geonho.vocautobot.adapter.in.web.statistics.dto;

import com.geonho.vocautobot.application.statistics.port.in.dto.KpiResult;
import lombok.Builder;
import lombok.Getter;

/**
 * KPI 조회 응답 DTO.
 */
@Getter
@Builder
public class KpiResponse {

    private long totalVocs;
    private long resolvedVocs;
    private long pendingVocs;
    private double avgResolutionTimeHours;
    private double resolutionRate;
    private long todayVocs;
    private long weekVocs;
    private long monthVocs;

    public static KpiResponse from(KpiResult result) {
        long pending = result.totalVocs() - result.resolvedVocs();

        return KpiResponse.builder()
                .totalVocs(result.totalVocs())
                .resolvedVocs(result.resolvedVocs())
                .pendingVocs(Math.max(pending, 0))
                .avgResolutionTimeHours(result.avgProcessingTimeHours())
                .resolutionRate(result.processingRate())
                .todayVocs(result.todayVocs())
                .weekVocs(result.weekVocs())
                .monthVocs(result.monthVocs())
                .build();
    }
}
