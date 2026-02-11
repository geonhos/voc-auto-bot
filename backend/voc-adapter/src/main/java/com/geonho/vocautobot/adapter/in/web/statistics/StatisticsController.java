package com.geonho.vocautobot.adapter.in.web.statistics;

import com.geonho.vocautobot.adapter.in.web.statistics.dto.CategoryStatsResponse;
import com.geonho.vocautobot.adapter.in.web.statistics.dto.DashboardResponse;
import com.geonho.vocautobot.adapter.in.web.statistics.dto.KpiResponse;
import com.geonho.vocautobot.adapter.in.web.statistics.dto.PriorityStatsResponse;
import com.geonho.vocautobot.adapter.in.web.statistics.dto.TrendResponse;
import com.geonho.vocautobot.application.statistics.port.in.GetCategoryStatsUseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetKpiUseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetPriorityStatsUseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetTrendUseCase;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import com.geonho.vocautobot.application.statistics.port.in.dto.CategoryStatsResult;
import com.geonho.vocautobot.application.statistics.port.in.dto.KpiResult;
import com.geonho.vocautobot.application.statistics.port.in.dto.PriorityStatsResult;
import com.geonho.vocautobot.application.statistics.port.in.dto.TrendResult;
import com.geonho.vocautobot.adapter.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 통계 조회 컨트롤러.
 */
@Tag(name = "Statistics", description = "통계 조회 API")
@RestController
@RequestMapping("/v1/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final GetKpiUseCase getKpiUseCase;
    private final GetTrendUseCase getTrendUseCase;
    private final GetCategoryStatsUseCase getCategoryStatsUseCase;
    private final GetPriorityStatsUseCase getPriorityStatsUseCase;
    private final StatisticsQueryPort statisticsQueryPort;

    @Operation(
            summary = "대시보드 통합 조회",
            description = "대시보드에 필요한 모든 통계 데이터를 한 번에 조회합니다"
    )
    @GetMapping("/dashboard")
    public ApiResponse<DashboardResponse> getDashboard(
            @Parameter(description = "시작일 (yyyy-MM-dd)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate fromDate,

            @Parameter(description = "종료일 (yyyy-MM-dd)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate toDate
    ) {
        // KPI 조회
        KpiResult kpiResult = getKpiUseCase.getKpi();
        KpiResponse kpiResponse = KpiResponse.from(kpiResult);

        // 트렌드 조회
        TrendResult trendResult;
        if (fromDate != null && toDate != null) {
            trendResult = getTrendUseCase.getTrend(fromDate, toDate);
        } else {
            trendResult = getTrendUseCase.getRecentTrend();
        }

        List<DashboardResponse.TrendDataPoint> trendData = trendResult.dataPoints().stream()
                .map(d -> DashboardResponse.TrendDataPoint.builder()
                        .date(d.date().toString())
                        .received(d.count())
                        .resolved(0)
                        .pending(0)
                        .build())
                .collect(Collectors.toList());

        // 카테고리별 통계
        CategoryStatsResult categoryResult = getCategoryStatsUseCase.getCategoryStats();
        List<DashboardResponse.CategoryStat> categoryStats = categoryResult.stats().stream()
                .map(item -> DashboardResponse.CategoryStat.builder()
                        .categoryId(item.categoryId())
                        .categoryName(item.categoryName())
                        .count(item.count())
                        .percentage(item.percentage())
                        .build())
                .collect(Collectors.toList());

        // 우선순위별 통계
        PriorityStatsResult priorityResult = getPriorityStatsUseCase.getPriorityStats();
        List<DashboardResponse.PriorityStat> priorityStats = priorityResult.stats().stream()
                .map(item -> DashboardResponse.PriorityStat.builder()
                        .priority(item.priority().name())
                        .priorityLabel(item.priorityDisplayName())
                        .count(item.count())
                        .percentage(0)
                        .build())
                .collect(Collectors.toList());

        // 상태별 분포 (KPI에서 계산)
        long total = kpiResult.totalVocs();
        long resolved = Math.round(total * kpiResult.processingRate() / 100.0);
        long pending = total - resolved;
        List<DashboardResponse.StatusDistributionItem> statusDistribution = List.of(
                DashboardResponse.StatusDistributionItem.builder()
                        .status("RESOLVED")
                        .statusLabel("완료")
                        .count(resolved)
                        .percentage(kpiResult.processingRate())
                        .build(),
                DashboardResponse.StatusDistributionItem.builder()
                        .status("IN_PROGRESS")
                        .statusLabel("처리중")
                        .count(pending)
                        .percentage(100.0 - kpiResult.processingRate())
                        .build()
        );

        DashboardResponse response = DashboardResponse.builder()
                .kpi(kpiResponse)
                .trend(trendData)
                .categoryStats(categoryStats)
                .statusDistribution(statusDistribution)
                .priorityDistribution(priorityStats)
                .build();

        return ApiResponse.success(response);
    }

    @Operation(
            summary = "KPI 조회",
            description = "VOC 처리 현황 KPI를 조회합니다 (총 VOC 수, 처리율, 평균 처리 시간)"
    )
    @GetMapping("/kpi")
    public ApiResponse<KpiResponse> getKpi() {
        KpiResult result = getKpiUseCase.getKpi();
        KpiResponse response = KpiResponse.from(result);

        return ApiResponse.success(response);
    }

    @Operation(
            summary = "VOC 트렌드 조회",
            description = "지정된 기간 동안의 일별 VOC 추이를 조회합니다"
    )
    @GetMapping("/trend")
    public ApiResponse<TrendResponse> getTrend(
            @Parameter(description = "시작일 (yyyy-MM-dd)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,

            @Parameter(description = "종료일 (yyyy-MM-dd)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate endDate
    ) {
        TrendResult result;

        if (startDate != null && endDate != null) {
            result = getTrendUseCase.getTrend(startDate, endDate);
        } else {
            // 기간 미지정 시 최근 30일 조회
            result = getTrendUseCase.getRecentTrend();
        }

        TrendResponse response = TrendResponse.from(result);

        return ApiResponse.success(response);
    }

    @Operation(
            summary = "카테고리별 통계 조회",
            description = "카테고리별 VOC 건수 및 비율을 조회합니다"
    )
    @GetMapping("/category")
    public ApiResponse<CategoryStatsResponse> getCategoryStats() {
        CategoryStatsResult result = getCategoryStatsUseCase.getCategoryStats();
        CategoryStatsResponse response = CategoryStatsResponse.from(result);

        return ApiResponse.success(response);
    }

    @Operation(
            summary = "우선순위별 통계 조회",
            description = "우선순위별 VOC 건수를 조회합니다"
    )
    @GetMapping("/priority")
    public ApiResponse<PriorityStatsResponse> getPriorityStats() {
        PriorityStatsResult result = getPriorityStatsUseCase.getPriorityStats();
        PriorityStatsResponse response = PriorityStatsResponse.from(result);

        return ApiResponse.success(response);
    }

    @Operation(
            summary = "감성 분석 분포 조회",
            description = "긍정/부정/중립 감성 분포를 조회합니다"
    )
    @GetMapping("/sentiment")
    public ApiResponse<Map<String, Long>> getSentimentStats() {
        Map<String, Long> sentimentStats = statisticsQueryPort.countVocsBySentiment();
        return ApiResponse.success(sentimentStats);
    }
}
