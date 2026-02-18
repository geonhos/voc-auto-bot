package com.geonho.vocautobot.application.statistics.port.in.dto;

/**
 * KPI(핵심성과지표) 조회 결과 DTO.
 */
public record KpiResult(
        long totalVocs,
        double processingRate,
        double avgProcessingTimeHours,
        long todayVocs,
        long weekVocs,
        long monthVocs,
        long resolvedVocs
) {
    public static KpiResult of(long totalVocs, long processedVocs, double avgProcessingTimeHours,
                                long todayVocs, long weekVocs, long monthVocs, long resolvedVocs) {
        double processingRate = totalVocs > 0
            ? Math.round((processedVocs * 100.0 / totalVocs) * 100.0) / 100.0
            : 0.0;

        return new KpiResult(
                totalVocs,
                processingRate,
                Math.round(avgProcessingTimeHours * 100.0) / 100.0,
                todayVocs,
                weekVocs,
                monthVocs,
                resolvedVocs
        );
    }
}
