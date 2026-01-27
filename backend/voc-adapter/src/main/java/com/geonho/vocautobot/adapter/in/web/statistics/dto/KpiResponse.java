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
    private double processingRate;
    private double avgProcessingTimeHours;

    public static KpiResponse from(KpiResult result) {
        return KpiResponse.builder()
                .totalVocs(result.totalVocs())
                .processingRate(result.processingRate())
                .avgProcessingTimeHours(result.avgProcessingTimeHours())
                .build();
    }
}
