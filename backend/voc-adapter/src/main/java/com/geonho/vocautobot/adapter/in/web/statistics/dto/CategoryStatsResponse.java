package com.geonho.vocautobot.adapter.in.web.statistics.dto;

import com.geonho.vocautobot.application.statistics.port.in.dto.CategoryStatsResult;
import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 카테고리별 통계 조회 응답 DTO.
 */
@Getter
@Builder
public class CategoryStatsResponse {

    private List<CategoryStat> stats;

    @Getter
    @Builder
    public static class CategoryStat {
        private Long categoryId;
        private String categoryName;
        private long count;
        private double percentage;

        public static CategoryStat from(CategoryStatsResult.CategoryStat stat) {
            return CategoryStat.builder()
                    .categoryId(stat.categoryId())
                    .categoryName(stat.categoryName())
                    .count(stat.count())
                    .percentage(stat.percentage())
                    .build();
        }
    }

    public static CategoryStatsResponse from(CategoryStatsResult result) {
        List<CategoryStat> stats = result.stats().stream()
                .map(CategoryStat::from)
                .collect(Collectors.toList());

        return CategoryStatsResponse.builder()
                .stats(stats)
                .build();
    }
}
