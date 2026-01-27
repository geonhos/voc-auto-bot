package com.geonho.vocautobot.adapter.in.web.statistics.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class DashboardResponse {
    private KpiResponse kpi;
    private List<TrendDataPoint> trend;
    private List<CategoryStat> categoryStats;
    private List<StatusDistributionItem> statusDistribution;
    private List<PriorityStat> priorityDistribution;

    @Getter
    @Builder
    public static class TrendDataPoint {
        private String date;
        private long received;
        private long resolved;
        private long pending;
    }

    @Getter
    @Builder
    public static class CategoryStat {
        private Long categoryId;
        private String categoryName;
        private long count;
        private double percentage;
    }

    @Getter
    @Builder
    public static class PriorityStat {
        private String priority;
        private String priorityLabel;
        private long count;
        private double percentage;
    }

    @Getter
    @Builder
    public static class StatusDistributionItem {
        private String status;
        private String statusLabel;
        private long count;
        private double percentage;
    }
}
