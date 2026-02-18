package com.geonho.vocautobot.application.statistics.usecase;

import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.statistics.port.in.dto.KpiResult;
import com.geonho.vocautobot.application.statistics.port.out.StatisticsQueryPort;
import com.geonho.vocautobot.domain.category.Category;
import com.geonho.vocautobot.domain.category.CategoryType;
import com.geonho.vocautobot.domain.voc.VocPriority;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@DisplayName("통계 서비스 테스트")
class StatisticsServiceTest {

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("KPI 조회")
    class GetKpi {

        @Mock
        private StatisticsQueryPort statisticsQueryPort;

        @InjectMocks
        private GetKpiService getKpiService;

        @Test
        @DisplayName("KPI 정상 조회")
        void shouldReturnKpi() {
            given(statisticsQueryPort.countTotalVocs()).willReturn(100L);
            given(statisticsQueryPort.countProcessedVocs()).willReturn(80L);
            given(statisticsQueryPort.calculateAverageProcessingTimeInHours()).willReturn(24.5);
            given(statisticsQueryPort.countResolvedVocs()).willReturn(70L);
            given(statisticsQueryPort.countVocsSince(any(LocalDateTime.class))).willReturn(10L);

            KpiResult result = getKpiService.getKpi();

            assertThat(result.totalVocs()).isEqualTo(100L);
            assertThat(result.processingRate()).isEqualTo(80.0);
            assertThat(result.avgProcessingTimeHours()).isEqualTo(24.5);
            assertThat(result.todayVocs()).isEqualTo(10L);
            assertThat(result.weekVocs()).isEqualTo(10L);
            assertThat(result.monthVocs()).isEqualTo(10L);
            assertThat(result.resolvedVocs()).isEqualTo(70L);
        }

        @Test
        @DisplayName("VOC가 없을 때 처리율 0%")
        void shouldReturn0RateWhenNoVocs() {
            given(statisticsQueryPort.countTotalVocs()).willReturn(0L);
            given(statisticsQueryPort.countProcessedVocs()).willReturn(0L);
            given(statisticsQueryPort.calculateAverageProcessingTimeInHours()).willReturn(0.0);
            given(statisticsQueryPort.countResolvedVocs()).willReturn(0L);
            given(statisticsQueryPort.countVocsSince(any(LocalDateTime.class))).willReturn(0L);

            KpiResult result = getKpiService.getKpi();

            assertThat(result.totalVocs()).isEqualTo(0L);
            assertThat(result.processingRate()).isEqualTo(0.0);
            assertThat(result.avgProcessingTimeHours()).isEqualTo(0.0);
            assertThat(result.todayVocs()).isEqualTo(0L);
        }

        @Test
        @DisplayName("부분 처리율 계산 검증")
        void shouldCalculatePartialProcessingRate() {
            given(statisticsQueryPort.countTotalVocs()).willReturn(3L);
            given(statisticsQueryPort.countProcessedVocs()).willReturn(1L);
            given(statisticsQueryPort.calculateAverageProcessingTimeInHours()).willReturn(12.0);
            given(statisticsQueryPort.countResolvedVocs()).willReturn(1L);
            given(statisticsQueryPort.countVocsSince(any(LocalDateTime.class))).willReturn(1L);

            KpiResult result = getKpiService.getKpi();

            assertThat(result.totalVocs()).isEqualTo(3L);
            assertThat(result.processingRate()).isEqualTo(33.33);
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("트렌드 조회")
    class GetTrend {

        @Mock
        private StatisticsQueryPort statisticsQueryPort;

        @InjectMocks
        private GetTrendService getTrendService;

        @Test
        @DisplayName("기간별 VOC 트렌드 조회 - 빈 날짜 0으로 채움")
        void shouldReturnTrendWithZeroForEmptyDates() {
            LocalDate start = LocalDate.of(2026, 2, 1);
            LocalDate end = LocalDate.of(2026, 2, 3);
            Map<LocalDate, Long> trendData = Map.of(
                    LocalDate.of(2026, 2, 1), 5L
            );
            given(statisticsQueryPort.countVocsByDateRange(start, end)).willReturn(trendData);

            var result = getTrendService.getTrend(start, end);

            assertThat(result).isNotNull();
            assertThat(result.dataPoints()).hasSize(3);
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("카테고리별 통계")
    class GetCategoryStats {

        @Mock
        private StatisticsQueryPort statisticsQueryPort;

        @Mock
        private LoadCategoryPort loadCategoryPort;

        @InjectMocks
        private GetCategoryStatsService getCategoryStatsService;

        @Test
        @DisplayName("카테고리별 VOC 건수 조회")
        void shouldReturnCategoryStats() {
            Map<Long, Long> categoryData = Map.of(1L, 30L, 2L, 20L);
            Category cat1 = new Category(1L, "배송", "DELIVERY", CategoryType.MAIN, null,
                    "배송", true, 1, 1, LocalDateTime.now(), LocalDateTime.now());
            Category cat2 = new Category(2L, "결제", "PAYMENT", CategoryType.MAIN, null,
                    "결제", true, 2, 1, LocalDateTime.now(), LocalDateTime.now());

            given(statisticsQueryPort.countVocsByCategory()).willReturn(categoryData);
            given(loadCategoryPort.loadById(1L)).willReturn(Optional.of(cat1));
            given(loadCategoryPort.loadById(2L)).willReturn(Optional.of(cat2));

            var result = getCategoryStatsService.getCategoryStats();

            assertThat(result).isNotNull();
            assertThat(result.stats()).hasSize(2);
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    @DisplayName("우선순위별 통계")
    class GetPriorityStats {

        @Mock
        private StatisticsQueryPort statisticsQueryPort;

        @InjectMocks
        private GetPriorityStatsService getPriorityStatsService;

        @Test
        @DisplayName("우선순위별 VOC 건수 조회")
        void shouldReturnPriorityStats() {
            Map<VocPriority, Long> priorityData = Map.of(
                    VocPriority.URGENT, 5L,
                    VocPriority.HIGH, 15L,
                    VocPriority.NORMAL, 50L,
                    VocPriority.LOW, 10L
            );
            given(statisticsQueryPort.countVocsByPriority()).willReturn(priorityData);

            var result = getPriorityStatsService.getPriorityStats();

            assertThat(result).isNotNull();
            assertThat(result.stats()).hasSize(4);
            assertThat(result.stats().get(0).priority()).isEqualTo(VocPriority.URGENT);
        }

        @Test
        @DisplayName("데이터 없는 우선순위도 0으로 표시")
        void shouldShowZeroForMissingPriorities() {
            Map<VocPriority, Long> priorityData = Map.of(VocPriority.NORMAL, 10L);
            given(statisticsQueryPort.countVocsByPriority()).willReturn(priorityData);

            var result = getPriorityStatsService.getPriorityStats();

            assertThat(result.stats()).hasSize(4);
        }
    }
}
