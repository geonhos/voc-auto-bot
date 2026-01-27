package com.geonho.vocautobot.adapter.out.search;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.dto.LogEntry;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.opensearch.client.opensearch.core.search.Hit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * OpenSearch 검색 결과를 도메인 모델로 매핑하는 매퍼
 */
@Component
public class LogSearchMapper {

    private static final Logger log = LoggerFactory.getLogger(LogSearchMapper.class);

    /**
     * OpenSearch Hit을 LogEntry로 변환
     */
    public LogEntry toLogEntry(Hit<Map> hit) {
        try {
            Map<String, Object> source = hit.source();
            if (source == null) {
                log.warn("Hit source is null for document ID: {}", hit.id());
                return null;
            }

            return new LogEntry(
                hit.id(),
                extractTimestamp(source),
                extractString(source, "level", "log_level", "logLevel"),
                extractString(source, "service", "service_name", "serviceName"),
                extractString(source, "message", "msg"),
                extractString(source, "logger", "logger_name", "loggerName"),
                extractString(source, "thread", "thread_name", "threadName"),
                extractAdditionalFields(source)
            );
        } catch (Exception e) {
            log.error("Failed to map hit to LogEntry: {}", hit.id(), e);
            return null;
        }
    }

    /**
     * SearchResponse를 LogAnalysisResult로 변환
     */
    public LogAnalysisResult toLogAnalysisResult(SearchResponse<Map> response) {
        List<LogEntry> logs = response.hits().hits().stream()
            .map(this::toLogEntry)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());

        Map<String, Integer> errorCounts = calculateErrorCounts(logs);
        Map<String, Integer> logLevelCounts = calculateLogLevelCounts(logs);
        Map<String, Integer> serviceCounts = calculateServiceCounts(logs);
        long totalCount = response.hits().total().value();

        String summary = generateSummary(logs, totalCount, errorCounts);

        return new LogAnalysisResult(
            logs,
            errorCounts,
            logLevelCounts,
            serviceCounts,
            totalCount,
            summary
        );
    }

    /**
     * 타임스탬프 추출 및 변환
     */
    private LocalDateTime extractTimestamp(Map<String, Object> source) {
        // @timestamp, timestamp, time 등 다양한 필드명 시도
        Object timestampObj = getFirstNonNull(source, "@timestamp", "timestamp", "time");

        if (timestampObj == null) {
            return LocalDateTime.now();
        }

        try {
            if (timestampObj instanceof String) {
                // ISO 8601 형식 파싱
                return LocalDateTime.parse(timestampObj.toString().substring(0, 19));
            } else if (timestampObj instanceof Number) {
                // Unix timestamp (milliseconds)
                long millis = ((Number) timestampObj).longValue();
                return LocalDateTime.ofInstant(Instant.ofEpochMilli(millis), ZoneId.systemDefault());
            }
        } catch (Exception e) {
            log.warn("Failed to parse timestamp: {}", timestampObj, e);
        }

        return LocalDateTime.now();
    }

    /**
     * 문자열 필드 추출 (여러 필드명 시도)
     */
    private String extractString(Map<String, Object> source, String... fieldNames) {
        Object value = getFirstNonNull(source, fieldNames);
        return value != null ? value.toString() : null;
    }

    /**
     * 첫 번째로 존재하는 필드 값 반환
     */
    private Object getFirstNonNull(Map<String, Object> source, String... fieldNames) {
        for (String fieldName : fieldNames) {
            Object value = source.get(fieldName);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    /**
     * 추가 필드 추출 (표준 필드를 제외한 나머지)
     */
    private Map<String, Object> extractAdditionalFields(Map<String, Object> source) {
        Set<String> standardFields = Set.of(
            "@timestamp", "timestamp", "time",
            "level", "log_level", "logLevel",
            "service", "service_name", "serviceName",
            "message", "msg",
            "logger", "logger_name", "loggerName",
            "thread", "thread_name", "threadName"
        );

        return source.entrySet().stream()
            .filter(entry -> !standardFields.contains(entry.getKey()))
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    /**
     * 서비스별 에러 카운트 계산
     */
    private Map<String, Integer> calculateErrorCounts(List<LogEntry> logs) {
        return logs.stream()
            .filter(LogEntry::isError)
            .collect(Collectors.groupingBy(
                log -> log.serviceName() != null ? log.serviceName() : "unknown",
                Collectors.summingInt(log -> 1)
            ));
    }

    /**
     * 로그 레벨별 카운트 계산
     */
    private Map<String, Integer> calculateLogLevelCounts(List<LogEntry> logs) {
        return logs.stream()
            .collect(Collectors.groupingBy(
                log -> log.logLevel() != null ? log.logLevel() : "UNKNOWN",
                Collectors.summingInt(log -> 1)
            ));
    }

    /**
     * 서비스별 카운트 계산
     */
    private Map<String, Integer> calculateServiceCounts(List<LogEntry> logs) {
        return logs.stream()
            .collect(Collectors.groupingBy(
                log -> log.serviceName() != null ? log.serviceName() : "unknown",
                Collectors.summingInt(log -> 1)
            ));
    }

    /**
     * 요약 메시지 생성
     */
    private String generateSummary(List<LogEntry> logs, long totalCount, Map<String, Integer> errorCounts) {
        int errorCount = errorCounts.values().stream().mapToInt(Integer::intValue).sum();
        int displayedCount = logs.size();

        StringBuilder summary = new StringBuilder();
        summary.append(String.format("총 %d건의 로그 중 %d건 조회", totalCount, displayedCount));

        if (errorCount > 0) {
            summary.append(String.format(", %d건의 에러 발생", errorCount));
            if (!errorCounts.isEmpty()) {
                String topErrorService = errorCounts.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("unknown");
                summary.append(String.format(" (주요 발생 서비스: %s)", topErrorService));
            }
        }

        return summary.toString();
    }
}
