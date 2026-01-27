package com.geonho.vocautobot.application.statistics.usecase;

import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.application.statistics.port.in.GetCategoryStatsUseCase;
import com.geonho.vocautobot.application.statistics.port.in.dto.CategoryStatsResult;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import com.geonho.vocautobot.domain.category.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 카테고리별 통계 조회 서비스 구현체.
 */
@UseCase
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GetCategoryStatsService implements GetCategoryStatsUseCase {

    private final StatisticsQueryPort statisticsQueryPort;
    private final LoadCategoryPort loadCategoryPort;

    @Override
    public CategoryStatsResult getCategoryStats() {
        Map<Long, Long> vocCountsByCategory = statisticsQueryPort.countVocsByCategory();
        long totalCount = vocCountsByCategory.values().stream()
                .mapToLong(Long::longValue)
                .sum();

        List<CategoryStatsResult.CategoryStat> stats = new ArrayList<>();

        for (Map.Entry<Long, Long> entry : vocCountsByCategory.entrySet()) {
            Long categoryId = entry.getKey();
            Long count = entry.getValue();

            Category category = loadCategoryPort.loadById(categoryId)
                    .orElse(null);

            String categoryName = category != null ? category.getName() : "Unknown";

            stats.add(CategoryStatsResult.CategoryStat.of(
                    categoryId,
                    categoryName,
                    count,
                    totalCount
            ));
        }

        // 건수가 많은 순으로 정렬
        stats.sort((a, b) -> Long.compare(b.count(), a.count()));

        return new CategoryStatsResult(stats);
    }
}
