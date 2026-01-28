package com.geonho.vocautobot.adapter.out.search;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.port.out.LogSearchPort;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.nio.PoolingAsyncClientConnectionManager;
import org.apache.hc.client5.http.impl.nio.PoolingAsyncClientConnectionManagerBuilder;
import org.apache.hc.client5.http.ssl.ClientTlsStrategyBuilder;
import org.apache.hc.core5.http.HttpHost;
import org.apache.hc.core5.http.nio.ssl.TlsStrategy;
import org.apache.hc.core5.ssl.SSLContextBuilder;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.SortOrder;
import org.opensearch.client.opensearch._types.query_dsl.BoolQuery;
import org.opensearch.client.opensearch._types.query_dsl.Query;
import org.opensearch.client.opensearch._types.query_dsl.RangeQuery;
import org.opensearch.client.opensearch.core.SearchRequest;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.opensearch.client.json.JsonData;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.transport.httpclient5.ApacheHttpClient5TransportBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.net.ssl.SSLContext;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

/**
 * OpenSearch Adapter 구현
 * LogSearchPort를 구현하여 OpenSearch와 연동
 */
@Component
public class OpenSearchAdapter implements LogSearchPort {

    private static final Logger log = LoggerFactory.getLogger(OpenSearchAdapter.class);
    private static final String TIMESTAMP_FIELD = "@timestamp";
    private static final String LOG_LEVEL_FIELD = "level";
    private static final String SERVICE_NAME_FIELD = "service";
    private static final String MESSAGE_FIELD = "message";

    private final OpenSearchProperties properties;
    private final LogSearchMapper mapper;
    private OpenSearchClient client;
    private OpenSearchTransport transport;
    private boolean available = false;

    public OpenSearchAdapter(OpenSearchProperties properties, LogSearchMapper mapper) {
        this.properties = properties;
        this.mapper = mapper;
    }

    @PostConstruct
    public void initialize() {
        // TODO: OpenSearch 연동 구현 예정 (GitHub Issue 참조)
        // 현재는 OpenSearch 연결을 비활성화하고, 빈 결과를 반환합니다.
        log.info("OpenSearch integration is currently disabled. Will be implemented in future release.");
        available = false;
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (transport != null) {
                transport.close();
                log.info("OpenSearch transport closed");
            }
        } catch (Exception e) {
            log.error("Error closing OpenSearch transport", e);
        }
    }

    /**
     * 연결 테스트
     */
    private void testConnection() {
        try {
            boolean pingResult = client.ping().value();
            if (!pingResult) {
                throw new OpenSearchException("OpenSearch ping 실패");
            }
            log.info("OpenSearch connection test successful");
        } catch (Exception e) {
            log.error("OpenSearch connection test failed", e);
            throw new OpenSearchException("OpenSearch 연결 테스트 실패", e);
        }
    }

    @Override
    public LogAnalysisResult searchLogs(String query, LocalDateTime startTime, LocalDateTime endTime, int maxResults) {
        if (!available) {
            log.warn("OpenSearch is not available, returning empty result");
            return LogAnalysisResult.empty();
        }
        log.info("Searching logs - Query: {}, Time range: {} to {}", query, startTime, endTime);

        try {
            Query searchQuery = buildQueryStringQuery(query);
            Query timeRangeQuery = buildTimeRangeQuery(startTime, endTime);

            Query combinedQuery = BoolQuery.of(b -> b
                .must(searchQuery)
                .filter(timeRangeQuery)
            )._toQuery();

            SearchRequest request = SearchRequest.of(s -> s
                .index(properties.getDefaultIndexPattern())
                .query(combinedQuery)
                .size(maxResults)
                .sort(sort -> sort.field(f -> f.field(TIMESTAMP_FIELD).order(SortOrder.Desc)))
            );

            SearchResponse<Map> response = client.search(request, Map.class);
            LogAnalysisResult result = mapper.toLogAnalysisResult(response);

            log.info("Search completed - Found {} logs out of {} total",
                result.logs().size(), result.totalCount());
            return result;

        } catch (Exception e) {
            log.error("Failed to search logs", e);
            throw new OpenSearchException("로그 검색 실패", e);
        }
    }

    @Override
    public LogAnalysisResult searchErrorLogs(String serviceName, LocalDateTime startTime, LocalDateTime endTime, int maxResults) {
        if (!available) {
            log.warn("OpenSearch is not available, returning empty result");
            return LogAnalysisResult.empty();
        }
        log.info("Searching error logs - Service: {}, Time range: {} to {}", serviceName, startTime, endTime);

        try {
            BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder()
                .must(buildLogLevelQuery("ERROR"))
                .filter(buildTimeRangeQuery(startTime, endTime));

            if (serviceName != null && !serviceName.isEmpty()) {
                boolQueryBuilder.must(buildServiceQuery(serviceName));
            }

            Query query = boolQueryBuilder.build()._toQuery();

            SearchRequest request = SearchRequest.of(s -> s
                .index(properties.getDefaultIndexPattern())
                .query(query)
                .size(maxResults)
                .sort(sort -> sort.field(f -> f.field(TIMESTAMP_FIELD).order(SortOrder.Desc)))
            );

            SearchResponse<Map> response = client.search(request, Map.class);
            LogAnalysisResult result = mapper.toLogAnalysisResult(response);

            log.info("Error log search completed - Found {} error logs", result.logs().size());
            return result;

        } catch (Exception e) {
            log.error("Failed to search error logs", e);
            throw new OpenSearchException("에러 로그 검색 실패", e);
        }
    }

    @Override
    public LogAnalysisResult getLogStatistics(LocalDateTime startTime, LocalDateTime endTime) {
        if (!available) {
            log.warn("OpenSearch is not available, returning empty result");
            return LogAnalysisResult.empty();
        }
        log.info("Getting log statistics - Time range: {} to {}", startTime, endTime);

        try {
            Query timeRangeQuery = buildTimeRangeQuery(startTime, endTime);

            SearchRequest request = SearchRequest.of(s -> s
                .index(properties.getDefaultIndexPattern())
                .query(timeRangeQuery)
                .size(1000) // 통계를 위해 충분한 샘플 조회
                .sort(sort -> sort.field(f -> f.field(TIMESTAMP_FIELD).order(SortOrder.Desc)))
            );

            SearchResponse<Map> response = client.search(request, Map.class);
            LogAnalysisResult result = mapper.toLogAnalysisResult(response);

            log.info("Statistics retrieved - Total: {}, Errors: {}",
                result.totalCount(), result.errorCounts().values().stream().mapToInt(Integer::intValue).sum());
            return result;

        } catch (Exception e) {
            log.error("Failed to get log statistics", e);
            throw new OpenSearchException("로그 통계 조회 실패", e);
        }
    }

    @Override
    public LogAnalysisResult searchServiceLogs(
        String serviceName,
        String logLevel,
        LocalDateTime startTime,
        LocalDateTime endTime,
        int maxResults
    ) {
        if (!available) {
            log.warn("OpenSearch is not available, returning empty result");
            return LogAnalysisResult.empty();
        }
        log.info("Searching service logs - Service: {}, Level: {}, Time range: {} to {}",
            serviceName, logLevel, startTime, endTime);

        try {
            BoolQuery.Builder boolQueryBuilder = new BoolQuery.Builder()
                .must(buildServiceQuery(serviceName))
                .filter(buildTimeRangeQuery(startTime, endTime));

            if (logLevel != null && !logLevel.isEmpty()) {
                boolQueryBuilder.must(buildLogLevelQuery(logLevel));
            }

            Query query = boolQueryBuilder.build()._toQuery();

            SearchRequest request = SearchRequest.of(s -> s
                .index(properties.getDefaultIndexPattern())
                .query(query)
                .size(maxResults)
                .sort(sort -> sort.field(f -> f.field(TIMESTAMP_FIELD).order(SortOrder.Desc)))
            );

            SearchResponse<Map> response = client.search(request, Map.class);
            LogAnalysisResult result = mapper.toLogAnalysisResult(response);

            log.info("Service log search completed - Found {} logs", result.logs().size());
            return result;

        } catch (Exception e) {
            log.error("Failed to search service logs", e);
            throw new OpenSearchException("서비스 로그 검색 실패", e);
        }
    }

    /**
     * 쿼리 문자열 쿼리 생성
     */
    private Query buildQueryStringQuery(String query) {
        return Query.of(q -> q
            .queryString(qs -> qs
                .query(query)
                .defaultField(MESSAGE_FIELD)
            )
        );
    }

    /**
     * 시간 범위 쿼리 생성
     */
    private Query buildTimeRangeQuery(LocalDateTime startTime, LocalDateTime endTime) {
        long startMillis = startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        long endMillis = endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();

        return RangeQuery.of(r -> r
            .field(TIMESTAMP_FIELD)
            .gte(JsonData.of(startMillis))
            .lte(JsonData.of(endMillis))
        )._toQuery();
    }

    /**
     * 로그 레벨 쿼리 생성
     */
    private Query buildLogLevelQuery(String logLevel) {
        return Query.of(q -> q
            .term(t -> t
                .field(LOG_LEVEL_FIELD)
                .value(v -> v.stringValue(logLevel))
            )
        );
    }

    /**
     * 서비스명 쿼리 생성
     */
    private Query buildServiceQuery(String serviceName) {
        return Query.of(q -> q
            .term(t -> t
                .field(SERVICE_NAME_FIELD)
                .value(v -> v.stringValue(serviceName))
            )
        );
    }

    /**
     * OpenSearch Exception
     */
    public static class OpenSearchException extends RuntimeException {
        public OpenSearchException(String message) {
            super(message);
        }

        public OpenSearchException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
