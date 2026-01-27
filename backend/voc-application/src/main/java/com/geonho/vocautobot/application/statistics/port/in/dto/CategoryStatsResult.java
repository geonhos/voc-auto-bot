package com.geonho.vocautobot.application.statistics.port.in.dto;

import java.util.List;

/**
 * 카테고리별 통계 조회 결과 DTO.
 */
public record CategoryStatsResult(
        List<CategoryStat> stats
) {
    public record CategoryStat(
            Long categoryId,
            String categoryName,
            long count,
            double percentage
    ) {
        public static CategoryStat of(Long categoryId, String categoryName, long count, long totalCount) {
            double percentage = totalCount > 0
                ? Math.round((count * 100.0 / totalCount) * 100.0) / 100.0
                : 0.0;

            return new CategoryStat(categoryId, categoryName, count, percentage);
        }
    }
}
