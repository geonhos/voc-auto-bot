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
        long resolved = Math.round(result.totalVocs() * result.processingRate() / 100.0);
        long pending = result.totalVocs() - resolved;

        return KpiResponse.builder()
                .totalVocs(result.totalVocs())
                .resolvedVocs(resolved)
                .pendingVocs(pending)
                .avgResolutionTimeHours(result.avgProcessingTimeHours())
                .resolutionRate(result.processingRate())
                .todayVocs(0) // TODO: 실제 구현 필요
                .weekVocs(0)  // TODO: 실제 구현 필요
                .monthVocs(result.totalVocs())
                .build();
    }
}
