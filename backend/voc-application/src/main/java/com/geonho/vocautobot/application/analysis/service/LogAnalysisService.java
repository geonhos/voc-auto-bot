package com.geonho.vocautobot.application.analysis.service;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.port.out.LogSearchPort;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * 로그 분석 서비스
 * LogSearchPort를 사용하여 로그 검색 및 분석 기능 제공
 */
@Service
@RequiredArgsConstructor
public class LogAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(LogAnalysisService.class);
    private static final int DEFAULT_MAX_RESULTS = 1000;

    private final LogSearchPort logSearchPort;

    /**
     * 최근 24시간 에러 로그 분석
     *
     * @return 에러 로그 분석 결과
     */
    public LogAnalysisResult analyzeRecentErrors() {
        log.info("Analyzing recent errors (last 24 hours)");

        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(24);

        LogAnalysisResult result = logSearchPort.searchErrorLogs(
            null,           // 모든 서비스
            startTime,
            endTime,
            DEFAULT_MAX_RESULTS
        );

        log.info("Recent error analysis completed - Total errors: {}, Services affected: {}",
            result.getErrorLogs().size(),
            result.errorCounts().size()
        );

        return result;
    }

    /**
     * 특정 서비스의 에러 로그 분석
     *
     * @param serviceName 서비스명
     * @param hours 분석 시간 범위 (시간)
     * @return 에러 로그 분석 결과
     */
    public LogAnalysisResult analyzeServiceErrors(String serviceName, int hours) {
        log.info("Analyzing errors for service: {} (last {} hours)", serviceName, hours);

        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(hours);

        LogAnalysisResult result = logSearchPort.searchErrorLogs(
            serviceName,
            startTime,
            endTime,
            DEFAULT_MAX_RESULTS
        );

        log.info("Service error analysis completed - Errors found: {}", result.getErrorLogs().size());

        return result;
    }

    /**
     * 키워드로 로그 검색
     *
     * @param keyword 검색 키워드
     * @param hours 검색 시간 범위 (시간)
     * @return 로그 검색 결과
     */
    public LogAnalysisResult searchLogsByKeyword(String keyword, int hours) {
        log.info("Searching logs by keyword: {} (last {} hours)", keyword, hours);

        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(hours);

        LogAnalysisResult result = logSearchPort.searchLogs(
            keyword,
            startTime,
            endTime,
            DEFAULT_MAX_RESULTS
        );

        log.info("Keyword search completed - Logs found: {}", result.logs().size());

        return result;
    }

    /**
     * 로그 통계 조회
     *
     * @param hours 통계 시간 범위 (시간)
     * @return 로그 통계
     */
    public LogAnalysisResult getLogStatistics(int hours) {
        log.info("Getting log statistics (last {} hours)", hours);

        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(hours);

        LogAnalysisResult result = logSearchPort.getLogStatistics(startTime, endTime);

        log.info("Statistics retrieved - Total logs: {}, Error count: {}",
            result.totalCount(),
            result.errorCounts().values().stream().mapToInt(Integer::intValue).sum()
        );

        return result;
    }

    /**
     * 특정 서비스의 특정 레벨 로그 조회
     *
     * @param serviceName 서비스명
     * @param logLevel 로그 레벨 (INFO, WARN, ERROR 등)
     * @param hours 조회 시간 범위 (시간)
     * @return 로그 조회 결과
     */
    public LogAnalysisResult getServiceLogsByLevel(String serviceName, String logLevel, int hours) {
        log.info("Getting {} logs for service: {} (last {} hours)", logLevel, serviceName, hours);

        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(hours);

        LogAnalysisResult result = logSearchPort.searchServiceLogs(
            serviceName,
            logLevel,
            startTime,
            endTime,
            DEFAULT_MAX_RESULTS
        );

        log.info("Service logs retrieved - Count: {}", result.logs().size());

        return result;
    }

    /**
     * 시스템 전체 건강도 체크 (에러율 기반)
     *
     * @param hours 체크 시간 범위 (시간)
     * @return 건강도 정보 (true: 정상, false: 비정상)
     */
    public SystemHealthCheck checkSystemHealth(int hours) {
        log.info("Checking system health (last {} hours)", hours);

        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(hours);

        // 전체 로그 통계 조회
        LogAnalysisResult statistics = logSearchPort.getLogStatistics(startTime, endTime);

        // 에러 로그 조회
        LogAnalysisResult errorLogs = logSearchPort.searchErrorLogs(null, startTime, endTime, DEFAULT_MAX_RESULTS);

        long totalLogs = statistics.totalCount();
        long errorCount = errorLogs.getErrorLogs().size();

        // 에러율 계산 (전체 로그 대비 에러 로그 비율)
        double errorRate = totalLogs > 0 ? (double) errorCount / totalLogs * 100 : 0;

        // 에러율 5% 이상이면 비정상으로 판단
        boolean isHealthy = errorRate < 5.0;

        String mostErrorProneService = errorLogs.getMostErrorProneService();

        log.info("System health check completed - Healthy: {}, Error rate: {:.2f}%, Most errors in: {}",
            isHealthy, errorRate, mostErrorProneService);

        return new SystemHealthCheck(
            isHealthy,
            errorRate,
            errorCount,
            totalLogs,
            mostErrorProneService,
            errorLogs.summary()
        );
    }

    /**
     * 시스템 건강도 체크 결과
     */
    public record SystemHealthCheck(
        boolean isHealthy,
        double errorRate,
        long errorCount,
        long totalLogs,
        String mostErrorProneService,
        String summary
    ) {
        public String getHealthStatus() {
            if (isHealthy) {
                return "HEALTHY";
            } else if (errorRate < 10) {
                return "WARNING";
            } else {
                return "CRITICAL";
            }
        }
    }
}
