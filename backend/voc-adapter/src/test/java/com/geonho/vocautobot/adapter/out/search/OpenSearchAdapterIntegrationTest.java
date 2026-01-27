package com.geonho.vocautobot.adapter.out.search;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.dto.LogEntry;
import org.junit.jupiter.api.*;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.Refresh;
import org.opensearch.client.opensearch.core.IndexRequest;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.transport.httpclient5.ApacheHttpClient5TransportBuilder;
import org.opensearch.testcontainers.OpensearchContainer;
import org.springframework.boot.test.context.SpringBootTest;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;

/**
 * OpenSearchAdapter 통합 테스트
 * Testcontainers를 사용하여 실제 OpenSearch 컨테이너와 연동 테스트
 */
@Testcontainers
@DisplayName("OpenSearchAdapter 통합 테스트")
class OpenSearchAdapterIntegrationTest {

    @Container
    static OpensearchContainer opensearchContainer = new OpensearchContainer("opensearchproject/opensearch:2.11.0")
        .withEnv("discovery.type", "single-node")
        .withEnv("OPENSEARCH_JAVA_OPTS", "-Xms512m -Xmx512m")
        .withEnv("plugins.security.disabled", "true");

    private static OpenSearchClient testClient;
    private static OpenSearchAdapter adapter;
    private static LogSearchMapper mapper;

    private static final String TEST_INDEX = "logs-test";

    @BeforeAll
    static void setUpAll() throws Exception {
        // OpenSearch 클라이언트 생성
        var transport = ApacheHttpClient5TransportBuilder
            .builder(opensearchContainer.getHttpHostAddress())
            .setMapper(new JacksonJsonpMapper())
            .build();

        testClient = new OpenSearchClient(transport);

        // Properties 설정
        OpenSearchProperties properties = new OpenSearchProperties();
        properties.setHost(opensearchContainer.getHost());
        properties.setPort(opensearchContainer.getMappedPort(9200));
        properties.setScheme("http");
        properties.setIndexPrefix("logs-");

        // Mapper 및 Adapter 생성
        mapper = new LogSearchMapper();
        adapter = new OpenSearchAdapter(properties, mapper);

        // 테스트 데이터 색인
        indexTestData();
    }

    @AfterAll
    static void tearDownAll() throws Exception {
        if (testClient != null) {
            // 테스트 인덱스 삭제
            testClient.indices().delete(d -> d.index(TEST_INDEX));
        }
    }

    @Test
    @DisplayName("로그 검색 - 쿼리 문자열")
    void searchLogs_WithQuery() {
        // given
        String query = "error";
        LocalDateTime startTime = LocalDateTime.now().minusHours(1);
        LocalDateTime endTime = LocalDateTime.now().plusHours(1);
        int maxResults = 100;

        // when
        LogAnalysisResult result = adapter.searchLogs(query, startTime, endTime, maxResults);

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs()).isNotEmpty();
        assertThat(result.logs())
            .allMatch(log -> log.message().toLowerCase().contains("error"));
    }

    @Test
    @DisplayName("에러 로그 검색 - 서비스별")
    void searchErrorLogs_ByService() {
        // given
        String serviceName = "voc-service";
        LocalDateTime startTime = LocalDateTime.now().minusHours(1);
        LocalDateTime endTime = LocalDateTime.now().plusHours(1);
        int maxResults = 100;

        // when
        LogAnalysisResult result = adapter.searchErrorLogs(serviceName, startTime, endTime, maxResults);

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs())
            .allMatch(LogEntry::isError)
            .allMatch(log -> log.isFromService(serviceName));
        assertThat(result.hasErrors()).isTrue();
    }

    @Test
    @DisplayName("에러 로그 검색 - 전체 서비스")
    void searchErrorLogs_AllServices() {
        // given
        LocalDateTime startTime = LocalDateTime.now().minusHours(1);
        LocalDateTime endTime = LocalDateTime.now().plusHours(1);
        int maxResults = 100;

        // when
        LogAnalysisResult result = adapter.searchErrorLogs(null, startTime, endTime, maxResults);

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs()).allMatch(LogEntry::isError);
        assertThat(result.errorCounts()).isNotEmpty();
    }

    @Test
    @DisplayName("로그 통계 조회")
    void getLogStatistics() {
        // given
        LocalDateTime startTime = LocalDateTime.now().minusHours(1);
        LocalDateTime endTime = LocalDateTime.now().plusHours(1);

        // when
        LogAnalysisResult result = adapter.getLogStatistics(startTime, endTime);

        // then
        assertThat(result).isNotNull();
        assertThat(result.totalCount()).isGreaterThan(0);
        assertThat(result.logLevelCounts()).isNotEmpty();
        assertThat(result.serviceCounts()).isNotEmpty();
        assertThat(result.summary()).contains("총");
    }

    @Test
    @DisplayName("서비스 로그 검색 - 로그 레벨 지정")
    void searchServiceLogs_WithLogLevel() {
        // given
        String serviceName = "voc-service";
        String logLevel = "ERROR";
        LocalDateTime startTime = LocalDateTime.now().minusHours(1);
        LocalDateTime endTime = LocalDateTime.now().plusHours(1);
        int maxResults = 100;

        // when
        LogAnalysisResult result = adapter.searchServiceLogs(
            serviceName, logLevel, startTime, endTime, maxResults
        );

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs())
            .allMatch(log -> log.isFromService(serviceName))
            .allMatch(log -> log.logLevel().equals(logLevel));
    }

    @Test
    @DisplayName("서비스 로그 검색 - 전체 로그 레벨")
    void searchServiceLogs_AllLevels() {
        // given
        String serviceName = "voc-service";
        LocalDateTime startTime = LocalDateTime.now().minusHours(1);
        LocalDateTime endTime = LocalDateTime.now().plusHours(1);
        int maxResults = 100;

        // when
        LogAnalysisResult result = adapter.searchServiceLogs(
            serviceName, null, startTime, endTime, maxResults
        );

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs()).allMatch(log -> log.isFromService(serviceName));
        assertThat(result.logLevelCounts().size()).isGreaterThan(1);
    }

    /**
     * 테스트 데이터 색인
     */
    private static void indexTestData() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        long timestamp = now.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();

        // 에러 로그 1
        indexLog("log-1", timestamp, "ERROR", "voc-service",
            "Database connection error occurred", "com.example.DbService");

        // 에러 로그 2
        indexLog("log-2", timestamp + 1000, "ERROR", "voc-service",
            "Network timeout error", "com.example.NetworkService");

        // 경고 로그
        indexLog("log-3", timestamp + 2000, "WARN", "voc-service",
            "Memory usage is high", "com.example.Monitor");

        // 정보 로그
        indexLog("log-4", timestamp + 3000, "INFO", "voc-service",
            "Application started successfully", "com.example.App");

        // 다른 서비스 에러 로그
        indexLog("log-5", timestamp + 4000, "ERROR", "user-service",
            "Authentication error", "com.example.AuthService");

        // 인덱스 갱신 (검색 가능하도록)
        Thread.sleep(1000);
    }

    /**
     * 로그 문서 색인
     */
    private static void indexLog(String id, long timestamp, String level, String service,
                                  String message, String logger) throws Exception {
        Map<String, Object> document = new HashMap<>();
        document.put("@timestamp", timestamp);
        document.put("level", level);
        document.put("service", service);
        document.put("message", message);
        document.put("logger", logger);
        document.put("thread", "main");

        IndexRequest<Map<String, Object>> request = IndexRequest.of(i -> i
            .index(TEST_INDEX)
            .id(id)
            .document(document)
            .refresh(Refresh.True)
        );

        testClient.index(request);
    }
}
