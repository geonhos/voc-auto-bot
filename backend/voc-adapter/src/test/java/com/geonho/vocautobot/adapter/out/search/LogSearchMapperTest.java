package com.geonho.vocautobot.adapter.out.search;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.dto.LogEntry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.opensearch.client.opensearch._types.SortOrder;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.opensearch.client.opensearch.core.search.Hit;
import org.opensearch.client.opensearch.core.search.HitsMetadata;
import org.opensearch.client.opensearch.core.search.TotalHits;
import org.opensearch.client.opensearch.core.search.TotalHitsRelation;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * LogSearchMapper 단위 테스트
 */
@DisplayName("LogSearchMapper 테스트")
class LogSearchMapperTest {

    private LogSearchMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new LogSearchMapper();
    }

    @Test
    @DisplayName("Hit을 LogEntry로 변환 - 성공")
    void toLogEntry_Success() {
        // given
        Map<String, Object> source = new HashMap<>();
        source.put("@timestamp", "2024-01-25T10:30:00");
        source.put("level", "ERROR");
        source.put("service", "voc-service");
        source.put("message", "Database connection failed");
        source.put("logger", "com.example.DbService");
        source.put("thread", "main");

        Hit<Map> hit = mock(Hit.class);
        when(hit.id()).thenReturn("test-log-1");
        when(hit.source()).thenReturn(source);

        // when
        LogEntry result = mapper.toLogEntry(hit);

        // then
        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo("test-log-1");
        assertThat(result.logLevel()).isEqualTo("ERROR");
        assertThat(result.serviceName()).isEqualTo("voc-service");
        assertThat(result.message()).isEqualTo("Database connection failed");
        assertThat(result.logger()).isEqualTo("com.example.DbService");
        assertThat(result.thread()).isEqualTo("main");
        assertThat(result.isError()).isTrue();
    }

    @Test
    @DisplayName("Hit을 LogEntry로 변환 - 대체 필드명 사용")
    void toLogEntry_AlternativeFieldNames() {
        // given
        Map<String, Object> source = new HashMap<>();
        source.put("timestamp", "2024-01-25T10:30:00");
        source.put("log_level", "WARN");
        source.put("service_name", "voc-service");
        source.put("msg", "Warning message");

        Hit<Map> hit = mock(Hit.class);
        when(hit.id()).thenReturn("test-log-2");
        when(hit.source()).thenReturn(source);

        // when
        LogEntry result = mapper.toLogEntry(hit);

        // then
        assertThat(result).isNotNull();
        assertThat(result.logLevel()).isEqualTo("WARN");
        assertThat(result.serviceName()).isEqualTo("voc-service");
        assertThat(result.message()).isEqualTo("Warning message");
        assertThat(result.isWarning()).isTrue();
    }

    @Test
    @DisplayName("Hit을 LogEntry로 변환 - null source 처리")
    void toLogEntry_NullSource() {
        // given
        Hit<Map> hit = mock(Hit.class);
        when(hit.id()).thenReturn("test-log-3");
        when(hit.source()).thenReturn(null);

        // when
        LogEntry result = mapper.toLogEntry(hit);

        // then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("SearchResponse를 LogAnalysisResult로 변환 - 성공")
    void toLogAnalysisResult_Success() {
        // given
        List<Hit<Map>> hits = createTestHits();

        HitsMetadata<Map> hitsMetadata = mock(HitsMetadata.class);
        when(hitsMetadata.hits()).thenReturn(hits);
        when(hitsMetadata.total()).thenReturn(
            TotalHits.of(t -> t.value(3).relation(TotalHitsRelation.Eq))
        );

        SearchResponse<Map> response = mock(SearchResponse.class);
        when(response.hits()).thenReturn(hitsMetadata);

        // when
        LogAnalysisResult result = mapper.toLogAnalysisResult(response);

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs()).hasSize(3);
        assertThat(result.totalCount()).isEqualTo(3);
        assertThat(result.errorCounts()).containsKey("voc-service");
        assertThat(result.errorCounts().get("voc-service")).isEqualTo(2);
        assertThat(result.logLevelCounts()).containsKeys("ERROR", "INFO");
        assertThat(result.serviceCounts()).containsKey("voc-service");
        assertThat(result.summary()).contains("총 3건");
    }

    @Test
    @DisplayName("에러 로그 필터링")
    void getErrorLogs() {
        // given
        List<Hit<Map>> hits = createTestHits();

        HitsMetadata<Map> hitsMetadata = mock(HitsMetadata.class);
        when(hitsMetadata.hits()).thenReturn(hits);
        when(hitsMetadata.total()).thenReturn(
            TotalHits.of(t -> t.value(3).relation(TotalHitsRelation.Eq))
        );

        SearchResponse<Map> response = mock(SearchResponse.class);
        when(response.hits()).thenReturn(hitsMetadata);

        LogAnalysisResult result = mapper.toLogAnalysisResult(response);

        // when
        List<LogEntry> errorLogs = result.getErrorLogs();

        // then
        assertThat(errorLogs).hasSize(2);
        assertThat(errorLogs).allMatch(LogEntry::isError);
    }

    @Test
    @DisplayName("서비스별 로그 필터링")
    void getLogsForService() {
        // given
        List<Hit<Map>> hits = createTestHits();

        HitsMetadata<Map> hitsMetadata = mock(HitsMetadata.class);
        when(hitsMetadata.hits()).thenReturn(hits);
        when(hitsMetadata.total()).thenReturn(
            TotalHits.of(t -> t.value(3).relation(TotalHitsRelation.Eq))
        );

        SearchResponse<Map> response = mock(SearchResponse.class);
        when(response.hits()).thenReturn(hitsMetadata);

        LogAnalysisResult result = mapper.toLogAnalysisResult(response);

        // when
        List<LogEntry> serviceLogs = result.getLogsForService("voc-service");

        // then
        assertThat(serviceLogs).hasSize(3);
        assertThat(serviceLogs).allMatch(log -> log.isFromService("voc-service"));
    }

    @Test
    @DisplayName("가장 많은 에러 발생 서비스 조회")
    void getMostErrorProneService() {
        // given
        List<Hit<Map>> hits = createTestHits();

        HitsMetadata<Map> hitsMetadata = mock(HitsMetadata.class);
        when(hitsMetadata.hits()).thenReturn(hits);
        when(hitsMetadata.total()).thenReturn(
            TotalHits.of(t -> t.value(3).relation(TotalHitsRelation.Eq))
        );

        SearchResponse<Map> response = mock(SearchResponse.class);
        when(response.hits()).thenReturn(hitsMetadata);

        LogAnalysisResult result = mapper.toLogAnalysisResult(response);

        // when
        String mostErrorProneService = result.getMostErrorProneService();

        // then
        assertThat(mostErrorProneService).isEqualTo("voc-service");
    }

    /**
     * 테스트용 Hit 리스트 생성
     */
    private List<Hit<Map>> createTestHits() {
        List<Hit<Map>> hits = new ArrayList<>();

        // Hit 1 - ERROR
        Map<String, Object> source1 = new HashMap<>();
        source1.put("@timestamp", "2024-01-25T10:30:00");
        source1.put("level", "ERROR");
        source1.put("service", "voc-service");
        source1.put("message", "Database error");

        Hit<Map> hit1 = mock(Hit.class);
        when(hit1.id()).thenReturn("log-1");
        when(hit1.source()).thenReturn(source1);
        hits.add(hit1);

        // Hit 2 - ERROR
        Map<String, Object> source2 = new HashMap<>();
        source2.put("@timestamp", "2024-01-25T10:31:00");
        source2.put("level", "ERROR");
        source2.put("service", "voc-service");
        source2.put("message", "Network error");

        Hit<Map> hit2 = mock(Hit.class);
        when(hit2.id()).thenReturn("log-2");
        when(hit2.source()).thenReturn(source2);
        hits.add(hit2);

        // Hit 3 - INFO
        Map<String, Object> source3 = new HashMap<>();
        source3.put("@timestamp", "2024-01-25T10:32:00");
        source3.put("level", "INFO");
        source3.put("service", "voc-service");
        source3.put("message", "Application started");

        Hit<Map> hit3 = mock(Hit.class);
        when(hit3.id()).thenReturn("log-3");
        when(hit3.source()).thenReturn(source3);
        hits.add(hit3);

        return hits;
    }
}
