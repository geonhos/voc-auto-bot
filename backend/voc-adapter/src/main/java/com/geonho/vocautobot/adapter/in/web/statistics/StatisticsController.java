package com.geonho.vocautobot.adapter.in.web.statistics;

import com.geonho.vocautobot.adapter.in.web.statistics.dto.CategoryStatsResponse;
import com.geonho.vocautobot.adapter.in.web.statistics.dto.KpiResponse;
import com.geonho.vocautobot.adapter.in.web.statistics.dto.PriorityStatsResponse;
import com.geonho.vocautobot.adapter.in.web.statistics.dto.TrendResponse;
import com.geonho.vocautobot.application.statistics.port.in.GetCategoryStatsUseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetKpiUseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetPriorityStatsUseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetTrendUseCase;
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

/**
 * 통계 조회 컨트롤러.
 */
@Tag(name = "Statistics", description = "통계 조회 API")
@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final GetKpiUseCase getKpiUseCase;
    private final GetTrendUseCase getTrendUseCase;
    private final GetCategoryStatsUseCase getCategoryStatsUseCase;
    private final GetPriorityStatsUseCase getPriorityStatsUseCase;

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
}
