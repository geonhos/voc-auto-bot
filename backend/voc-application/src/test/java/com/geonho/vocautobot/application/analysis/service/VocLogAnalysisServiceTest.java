package com.geonho.vocautobot.application.analysis.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.dto.LogEntry;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.port.out.LogSearchPort;
import com.geonho.vocautobot.application.analysis.port.out.LlmPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("VOC 로그 분석 서비스 테스트")
class VocLogAnalysisServiceTest {

    @Mock
    private LogSearchPort logSearchPort;

    @Mock
    private LlmPort llmPort;

    private VocLogAnalysisService vocLogAnalysisService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        vocLogAnalysisService = new VocLogAnalysisService(
                logSearchPort,
                llmPort,
                objectMapper
        );
    }

    @Test
    @DisplayName("VOC 내용에서 키워드를 추출하여 로그를 검색하고 AI로 분석한다")
    void analyzeLogsForVoc_Success() {
        // Given
        String vocTitle = "데이터베이스 연결 오류";
        String vocContent = "고객이 로그인 시도 시 데이터베이스 연결 타임아웃 에러가 발생합니다.";

        // Mock log search results
        List<LogEntry> mockLogs = List.of(
                new LogEntry(
                        "log-1",
                        LocalDateTime.now(),
                        "ERROR",
                        "voc-backend",
                        "Database connection timeout after 30s",
                        "com.geonho.vocautobot.adapter.out.persistence",
                        "http-nio-8080-exec-1",
                        Map.of()
                ),
                new LogEntry(
                        "log-2",
                        LocalDateTime.now(),
                        "ERROR",
                        "voc-backend",
                        "Failed to acquire connection from pool",
                        "com.zaxxer.hikari.pool.HikariPool",
                        "http-nio-8080-exec-2",
                        Map.of()
                )
        );

        LogAnalysisResult mockSearchResult = new LogAnalysisResult(
                mockLogs,
                Map.of("voc-backend", 2),
                Map.of("ERROR", 2),
                Map.of("voc-backend", 2),
                2,
                "Found 2 error logs"
        );

        when(logSearchPort.searchLogs(anyString(), any(), any(), anyInt()))
                .thenReturn(mockSearchResult);

        // Mock LLM response
        String mockLlmResponse = """
                {
                  "summary": "Database connection pool exhaustion causing timeout errors during login attempts",
                  "confidence": 0.85,
                  "keywords": ["database", "connection", "timeout", "pool"],
                  "possibleCauses": [
                    "Connection pool size too small",
                    "Long-running queries not being closed",
                    "Database server performance degradation"
                  ],
                  "recommendation": "Increase HikariCP connection pool size and review slow queries"
                }
                """;

        when(llmPort.sendPrompt(anyString())).thenReturn(mockLlmResponse);

        // When
        VocLogAnalysis result = vocLogAnalysisService.analyzeLogsForVoc(vocTitle, vocContent);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.summary()).contains("Database connection pool");
        assertThat(result.confidence()).isEqualTo(0.85);
        assertThat(result.keywords()).contains("database", "connection", "timeout");
        assertThat(result.possibleCauses()).hasSize(3);
        assertThat(result.recommendation()).contains("HikariCP");
        assertThat(result.relatedLogs()).hasSize(2);

        // Verify interactions
        verify(logSearchPort, atLeastOnce()).searchLogs(anyString(), any(), any(), anyInt());
        verify(llmPort, times(1)).sendPrompt(anyString());
    }

    @Test
    @DisplayName("로그가 없을 경우 빈 분석 결과를 반환한다")
    void analyzeLogsForVoc_NoLogsFound() {
        // Given
        String vocTitle = "일반 문의";
        String vocContent = "상품 정보를 알고 싶습니다.";

        LogAnalysisResult emptySearchResult = new LogAnalysisResult(
                List.of(),
                Map.of(),
                Map.of(),
                Map.of(),
                0,
                "No logs found"
        );

        when(logSearchPort.searchLogs(anyString(), any(), any(), anyInt()))
                .thenReturn(emptySearchResult);

        // When
        VocLogAnalysis result = vocLogAnalysisService.analyzeLogsForVoc(vocTitle, vocContent);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.summary()).contains("관련 로그를 찾을 수 없습니다");
        assertThat(result.confidence()).isEqualTo(0.0);
        assertThat(result.isValid()).isFalse();

        // LLM은 호출되지 않아야 함
        verify(llmPort, never()).sendPrompt(anyString());
    }

    @Test
    @DisplayName("로그 검색 중 오류가 발생해도 안전하게 처리한다")
    void analyzeLogsForVoc_SearchError() {
        // Given
        String vocTitle = "시스템 오류";
        String vocContent = "알 수 없는 오류가 발생했습니다.";

        when(logSearchPort.searchLogs(anyString(), any(), any(), anyInt()))
                .thenThrow(new RuntimeException("OpenSearch connection failed"));

        // When
        VocLogAnalysis result = vocLogAnalysisService.analyzeLogsForVoc(vocTitle, vocContent);

        // Then
        // Service gracefully handles per-keyword search errors and returns empty result
        // when all keyword searches fail (no logs found)
        assertThat(result).isNotNull();
        assertThat(result.confidence()).isEqualTo(0.0);
        // Implementation catches errors per-keyword, resulting in empty logs and "no logs found" message
        assertThat(result.summary()).contains("관련 로그를 찾을 수 없습니다");
    }

    @Test
    @DisplayName("AI 분석 중 오류가 발생해도 안전하게 처리한다")
    void analyzeLogsForVoc_LlmError() {
        // Given
        String vocTitle = "에러 발생";
        String vocContent = "시스템 에러가 발생합니다.";

        List<LogEntry> mockLogs = List.of(
                new LogEntry(
                        "log-1",
                        LocalDateTime.now(),
                        "ERROR",
                        "voc-backend",
                        "Test error",
                        "test.logger",
                        "test-thread",
                        Map.of()
                )
        );

        LogAnalysisResult mockSearchResult = new LogAnalysisResult(
                mockLogs,
                Map.of(),
                Map.of(),
                Map.of(),
                1,
                "Found logs"
        );

        when(logSearchPort.searchLogs(anyString(), any(), any(), anyInt()))
                .thenReturn(mockSearchResult);

        when(llmPort.sendPrompt(anyString()))
                .thenThrow(new RuntimeException("LLM service unavailable"));

        // When
        VocLogAnalysis result = vocLogAnalysisService.analyzeLogsForVoc(vocTitle, vocContent);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.summary()).contains("AI 분석 중 오류가 발생했습니다");
        assertThat(result.confidence()).isEqualTo(0.0);
    }
}
