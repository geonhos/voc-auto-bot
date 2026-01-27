package com.geonho.vocautobot.application.analysis.dto;

import java.util.List;
import java.util.Map;

/**
 * 로그 분석 결과 DTO
 * 로그 검색 및 통계 분석 결과를 표현
 */
public record LogAnalysisResult(
    List<LogEntry> logs,
    Map<String, Integer> errorCounts,
    Map<String, Integer> logLevelCounts,
    Map<String, Integer> serviceCounts,
    long totalCount,
    String summary
) {

    /**
     * 에러 로그만 필터링
     */
    public List<LogEntry> getErrorLogs() {
        return logs.stream()
            .filter(LogEntry::isError)
            .toList();
    }

    /**
     * 특정 서비스의 로그만 필터링
     */
    public List<LogEntry> getLogsForService(String serviceName) {
        return logs.stream()
            .filter(log -> log.isFromService(serviceName))
            .toList();
    }

    /**
     * 특정 로그 레벨의 개수 조회
     */
    public int getCountByLevel(String logLevel) {
        return logLevelCounts.getOrDefault(logLevel, 0);
    }

    /**
     * 가장 많은 에러가 발생한 서비스 조회
     */
    public String getMostErrorProneService() {
        return errorCounts.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(Map.Entry::getKey)
            .orElse(null);
    }

    /**
     * 에러 발생 여부 확인
     */
    public boolean hasErrors() {
        return !errorCounts.isEmpty() && errorCounts.values().stream().anyMatch(count -> count > 0);
    }

    /**
     * 빈 결과 생성
     */
    public static LogAnalysisResult empty(String summary) {
        return new LogAnalysisResult(
            List.of(),
            Map.of(),
            Map.of(),
            Map.of(),
            0,
            summary
        );
    }
}
