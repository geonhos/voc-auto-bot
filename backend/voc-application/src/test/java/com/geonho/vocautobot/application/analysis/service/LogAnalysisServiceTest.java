package com.geonho.vocautobot.application.analysis.service;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.dto.LogEntry;
import com.geonho.vocautobot.application.analysis.port.out.LogSearchPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * LogAnalysisService 단위 테스트
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LogAnalysisService 테스트")
class LogAnalysisServiceTest {

    @Mock
    private LogSearchPort logSearchPort;

    @InjectMocks
    private LogAnalysisService service;

    private LogAnalysisResult mockErrorResult;
    private LogAnalysisResult mockSearchResult;
    private LogAnalysisResult mockStatistics;

    @BeforeEach
    void setUp() {
        // Mock 에러 로그 결과
        List<LogEntry> errorLogs = List.of(
            createLogEntry("log-1", "ERROR", "voc-service", "Database error"),
            createLogEntry("log-2", "ERROR", "voc-service", "Network error"),
            createLogEntry("log-3", "ERROR", "user-service", "Auth error")
        );

        mockErrorResult = new LogAnalysisResult(
            errorLogs,
            Map.of("voc-service", 2, "user-service", 1),
            Map.of("ERROR", 3),
            Map.of("voc-service", 2, "user-service", 1),
            3,
            "3건의 에러 발생"
        );

        // Mock 검색 결과
        List<LogEntry> searchLogs = List.of(
            createLogEntry("log-1", "ERROR", "voc-service", "Database error"),
            createLogEntry("log-2", "INFO", "voc-service", "Database connected")
        );

        mockSearchResult = new LogAnalysisResult(
            searchLogs,
            Map.of("voc-service", 1),
            Map.of("ERROR", 1, "INFO", 1),
            Map.of("voc-service", 2),
            2,
            "2건 검색"
        );

        // Mock 통계
        mockStatistics = new LogAnalysisResult(
            List.of(),
            Map.of("voc-service", 5),
            Map.of("INFO", 85, "WARN", 10, "ERROR", 5),
            Map.of("voc-service", 50, "user-service", 50),
            100,
            "총 100건"
        );
    }

    @Test
    @DisplayName("최근 24시간 에러 분석 - 성공")
    void analyzeRecentErrors_Success() {
        // given
        when(logSearchPort.searchErrorLogs(isNull(), any(), any(), anyInt()))
            .thenReturn(mockErrorResult);

        // when
        LogAnalysisResult result = service.analyzeRecentErrors();

        // then
        assertThat(result).isNotNull();
        assertThat(result.getErrorLogs()).hasSize(3);
        assertThat(result.errorCounts()).hasSize(2);

        verify(logSearchPort).searchErrorLogs(
            isNull(),
            any(LocalDateTime.class),
            any(LocalDateTime.class),
            eq(1000)
        );
    }

    @Test
    @DisplayName("서비스 에러 분석 - 성공")
    void analyzeServiceErrors_Success() {
        // given
        String serviceName = "voc-service";
        int hours = 12;

        List<LogEntry> serviceLogs = List.of(
            createLogEntry("log-1", "ERROR", serviceName, "Database error"),
            createLogEntry("log-2", "ERROR", serviceName, "Network error")
        );

        LogAnalysisResult serviceResult = new LogAnalysisResult(
            serviceLogs,
            Map.of(serviceName, 2),
            Map.of("ERROR", 2),
            Map.of(serviceName, 2),
            2,
            "2건의 에러"
        );

        when(logSearchPort.searchErrorLogs(eq(serviceName), any(), any(), anyInt()))
            .thenReturn(serviceResult);

        // when
        LogAnalysisResult result = service.analyzeServiceErrors(serviceName, hours);

        // then
        assertThat(result).isNotNull();
        assertThat(result.getErrorLogs()).hasSize(2);
        assertThat(result.getErrorLogs()).allMatch(log -> log.isFromService(serviceName));

        verify(logSearchPort).searchErrorLogs(
            eq(serviceName),
            any(LocalDateTime.class),
            any(LocalDateTime.class),
            eq(1000)
        );
    }

    @Test
    @DisplayName("키워드로 로그 검색 - 성공")
    void searchLogsByKeyword_Success() {
        // given
        String keyword = "database";
        int hours = 1;

        when(logSearchPort.searchLogs(eq(keyword), any(), any(), anyInt()))
            .thenReturn(mockSearchResult);

        // when
        LogAnalysisResult result = service.searchLogsByKeyword(keyword, hours);

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs()).hasSize(2);

        verify(logSearchPort).searchLogs(
            eq(keyword),
            any(LocalDateTime.class),
            any(LocalDateTime.class),
            eq(1000)
        );
    }

    @Test
    @DisplayName("로그 통계 조회 - 성공")
    void getLogStatistics_Success() {
        // given
        int hours = 24;

        when(logSearchPort.getLogStatistics(any(), any()))
            .thenReturn(mockStatistics);

        // when
        LogAnalysisResult result = service.getLogStatistics(hours);

        // then
        assertThat(result).isNotNull();
        assertThat(result.totalCount()).isEqualTo(100);
        assertThat(result.logLevelCounts()).hasSize(3);

        verify(logSearchPort).getLogStatistics(
            any(LocalDateTime.class),
            any(LocalDateTime.class)
        );
    }

    @Test
    @DisplayName("서비스 로그 레벨별 조회 - 성공")
    void getServiceLogsByLevel_Success() {
        // given
        String serviceName = "voc-service";
        String logLevel = "ERROR";
        int hours = 6;

        List<LogEntry> levelLogs = List.of(
            createLogEntry("log-1", logLevel, serviceName, "Error 1"),
            createLogEntry("log-2", logLevel, serviceName, "Error 2")
        );

        LogAnalysisResult levelResult = new LogAnalysisResult(
            levelLogs,
            Map.of(serviceName, 2),
            Map.of(logLevel, 2),
            Map.of(serviceName, 2),
            2,
            "2건"
        );

        when(logSearchPort.searchServiceLogs(eq(serviceName), eq(logLevel), any(), any(), anyInt()))
            .thenReturn(levelResult);

        // when
        LogAnalysisResult result = service.getServiceLogsByLevel(serviceName, logLevel, hours);

        // then
        assertThat(result).isNotNull();
        assertThat(result.logs()).hasSize(2);
        assertThat(result.logs()).allMatch(log ->
            log.isFromService(serviceName) && log.logLevel().equals(logLevel)
        );

        verify(logSearchPort).searchServiceLogs(
            eq(serviceName),
            eq(logLevel),
            any(LocalDateTime.class),
            any(LocalDateTime.class),
            eq(1000)
        );
    }

    @Test
    @DisplayName("시스템 건강도 체크 - 정상 (에러율 5% 미만)")
    void checkSystemHealth_Healthy() {
        // given
        int hours = 1;

        // 100개 중 3개 에러 (3% 에러율)
        when(logSearchPort.getLogStatistics(any(), any()))
            .thenReturn(mockStatistics);

        List<LogEntry> minorErrors = List.of(
            createLogEntry("log-1", "ERROR", "voc-service", "Minor error")
        );

        LogAnalysisResult minorErrorResult = new LogAnalysisResult(
            minorErrors,
            Map.of("voc-service", 1),
            Map.of("ERROR", 1),
            Map.of("voc-service", 1),
            1,
            "1건의 에러"
        );

        when(logSearchPort.searchErrorLogs(isNull(), any(), any(), anyInt()))
            .thenReturn(minorErrorResult);

        // when
        LogAnalysisService.SystemHealthCheck health = service.checkSystemHealth(hours);

        // then
        assertThat(health).isNotNull();
        assertThat(health.isHealthy()).isTrue();
        assertThat(health.errorRate()).isLessThan(5.0);
        assertThat(health.getHealthStatus()).isEqualTo("HEALTHY");
    }

    @Test
    @DisplayName("시스템 건강도 체크 - 경고 (에러율 5-10%)")
    void checkSystemHealth_Warning() {
        // given
        int hours = 1;

        when(logSearchPort.getLogStatistics(any(), any()))
            .thenReturn(mockStatistics);

        // 100개 중 7개 에러 (7% 에러율)
        List<LogEntry> warningErrors = List.of(
            createLogEntry("log-1", "ERROR", "voc-service", "Error 1"),
            createLogEntry("log-2", "ERROR", "voc-service", "Error 2"),
            createLogEntry("log-3", "ERROR", "voc-service", "Error 3"),
            createLogEntry("log-4", "ERROR", "voc-service", "Error 4"),
            createLogEntry("log-5", "ERROR", "voc-service", "Error 5"),
            createLogEntry("log-6", "ERROR", "voc-service", "Error 6"),
            createLogEntry("log-7", "ERROR", "voc-service", "Error 7")
        );

        LogAnalysisResult warningResult = new LogAnalysisResult(
            warningErrors,
            Map.of("voc-service", 7),
            Map.of("ERROR", 7),
            Map.of("voc-service", 7),
            7,
            "7건의 에러"
        );

        when(logSearchPort.searchErrorLogs(isNull(), any(), any(), anyInt()))
            .thenReturn(warningResult);

        // when
        LogAnalysisService.SystemHealthCheck health = service.checkSystemHealth(hours);

        // then
        assertThat(health).isNotNull();
        assertThat(health.isHealthy()).isFalse();
        assertThat(health.errorRate()).isBetween(5.0, 10.0);
        assertThat(health.getHealthStatus()).isEqualTo("WARNING");
    }

    @Test
    @DisplayName("시스템 건강도 체크 - 위험 (에러율 10% 이상)")
    void checkSystemHealth_Critical() {
        // given
        int hours = 1;

        when(logSearchPort.getLogStatistics(any(), any()))
            .thenReturn(mockStatistics);

        // 100개 중 15개 에러 (15% 에러율)
        List<LogEntry> criticalErrors = List.of(
            createLogEntry("log-1", "ERROR", "voc-service", "Critical error 1"),
            createLogEntry("log-2", "ERROR", "voc-service", "Critical error 2"),
            createLogEntry("log-3", "ERROR", "voc-service", "Critical error 3"),
            createLogEntry("log-4", "ERROR", "voc-service", "Critical error 4"),
            createLogEntry("log-5", "ERROR", "voc-service", "Critical error 5"),
            createLogEntry("log-6", "ERROR", "voc-service", "Critical error 6"),
            createLogEntry("log-7", "ERROR", "voc-service", "Critical error 7"),
            createLogEntry("log-8", "ERROR", "voc-service", "Critical error 8"),
            createLogEntry("log-9", "ERROR", "voc-service", "Critical error 9"),
            createLogEntry("log-10", "ERROR", "voc-service", "Critical error 10"),
            createLogEntry("log-11", "ERROR", "voc-service", "Critical error 11"),
            createLogEntry("log-12", "ERROR", "voc-service", "Critical error 12"),
            createLogEntry("log-13", "ERROR", "voc-service", "Critical error 13"),
            createLogEntry("log-14", "ERROR", "voc-service", "Critical error 14"),
            createLogEntry("log-15", "ERROR", "voc-service", "Critical error 15")
        );

        LogAnalysisResult criticalResult = new LogAnalysisResult(
            criticalErrors,
            Map.of("voc-service", 15),
            Map.of("ERROR", 15),
            Map.of("voc-service", 15),
            15,
            "15건의 에러"
        );

        when(logSearchPort.searchErrorLogs(isNull(), any(), any(), anyInt()))
            .thenReturn(criticalResult);

        // when
        LogAnalysisService.SystemHealthCheck health = service.checkSystemHealth(hours);

        // then
        assertThat(health).isNotNull();
        assertThat(health.isHealthy()).isFalse();
        assertThat(health.errorRate()).isGreaterThanOrEqualTo(10.0);
        assertThat(health.getHealthStatus()).isEqualTo("CRITICAL");
        assertThat(health.mostErrorProneService()).isEqualTo("voc-service");
    }

    /**
     * 테스트용 LogEntry 생성
     */
    private LogEntry createLogEntry(String id, String level, String service, String message) {
        return new LogEntry(
            id,
            LocalDateTime.now(),
            level,
            service,
            message,
            "com.example.Test",
            "main",
            Map.of()
        );
    }
}
