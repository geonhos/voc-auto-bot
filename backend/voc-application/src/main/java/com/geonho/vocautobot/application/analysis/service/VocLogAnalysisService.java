package com.geonho.vocautobot.application.analysis.service;

import com.geonho.vocautobot.application.analysis.dto.LogAnalysisResult;
import com.geonho.vocautobot.application.analysis.dto.LogEntry;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.RelatedLog;
import com.geonho.vocautobot.application.analysis.port.out.LogSearchPort;
import com.geonho.vocautobot.application.analysis.port.out.LlmPort;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * VOC 로그 분석 서비스
 * VOC 내용을 기반으로 관련 로그를 검색하고 AI로 분석
 */
@Service
@RequiredArgsConstructor
public class VocLogAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(VocLogAnalysisService.class);
    private static final int LOG_SEARCH_HOURS = 24;
    private static final int MAX_LOG_RESULTS = 50;
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final LogSearchPort logSearchPort;
    private final LlmPort llmPort;
    private final ObjectMapper objectMapper;

    /**
     * VOC 내용을 기반으로 관련 로그를 분석
     *
     * @param vocTitle VOC 제목
     * @param vocContent VOC 내용
     * @return AI 로그 분석 결과
     */
    public VocLogAnalysis analyzeLogsForVoc(String vocTitle, String vocContent) {
        log.info("Analyzing logs for VOC: {}", vocTitle);

        try {
            // 1. VOC 내용에서 키워드 추출
            List<String> keywords = extractKeywords(vocTitle, vocContent);
            if (keywords.isEmpty()) {
                log.warn("No keywords extracted from VOC content");
                return VocLogAnalysis.empty("VOC 내용에서 키워드를 추출할 수 없습니다.");
            }

            // 2. 키워드로 로그 검색 (최근 24시간)
            LogAnalysisResult logSearchResult = searchRelevantLogs(keywords);
            if (logSearchResult.logs().isEmpty()) {
                log.info("No relevant logs found for VOC");
                return VocLogAnalysis.empty("관련 로그를 찾을 수 없습니다.");
            }

            // 3. LLM으로 로그 분석
            return analyzeLogsWithLlm(vocTitle, vocContent, logSearchResult, keywords);

        } catch (Exception e) {
            log.error("Error analyzing logs for VOC", e);
            return VocLogAnalysis.empty("로그 분석 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    /**
     * VOC 제목과 내용에서 키워드 추출
     */
    private List<String> extractKeywords(String title, String content) {
        List<String> keywords = new ArrayList<>();

        // 간단한 키워드 추출 (실제로는 더 정교한 NLP 기법 사용 가능)
        String text = (title + " " + content).toLowerCase();

        // 에러 관련 키워드
        if (text.contains("오류") || text.contains("에러") || text.contains("error")) {
            keywords.add("error");
        }
        if (text.contains("실패") || text.contains("failed") || text.contains("failure")) {
            keywords.add("failed");
        }
        if (text.contains("느림") || text.contains("느려") || text.contains("slow") || text.contains("timeout")) {
            keywords.add("timeout");
        }
        if (text.contains("연결") || text.contains("connection")) {
            keywords.add("connection");
        }
        if (text.contains("데이터베이스") || text.contains("database") || text.contains("db")) {
            keywords.add("database");
        }
        if (text.contains("api")) {
            keywords.add("api");
        }
        if (text.contains("인증") || text.contains("로그인") || text.contains("auth")) {
            keywords.add("auth");
        }

        // 최소한 "error"는 기본으로 검색
        if (keywords.isEmpty()) {
            keywords.add("error");
            keywords.add("exception");
        }

        log.debug("Extracted keywords: {}", keywords);
        return keywords;
    }

    /**
     * 키워드로 관련 로그 검색
     */
    private LogAnalysisResult searchRelevantLogs(List<String> keywords) {
        LocalDateTime endTime = LocalDateTime.now();
        LocalDateTime startTime = endTime.minusHours(LOG_SEARCH_HOURS);

        // 각 키워드로 로그 검색 후 병합
        List<LogEntry> allLogs = new ArrayList<>();
        for (String keyword : keywords) {
            try {
                LogAnalysisResult result = logSearchPort.searchLogs(
                    keyword,
                    startTime,
                    endTime,
                    MAX_LOG_RESULTS / keywords.size() // 키워드당 할당량 분배
                );
                allLogs.addAll(result.logs());
            } catch (Exception e) {
                log.warn("Failed to search logs with keyword: {}", keyword, e);
            }
        }

        // 중복 제거 (ID 기준)
        List<LogEntry> uniqueLogs = allLogs.stream()
            .distinct()
            .limit(MAX_LOG_RESULTS)
            .toList();

        log.info("Found {} relevant logs", uniqueLogs.size());

        return new LogAnalysisResult(
            uniqueLogs,
            java.util.Map.of(),
            java.util.Map.of(),
            java.util.Map.of(),
            uniqueLogs.size(),
            "Logs found for VOC analysis"
        );
    }

    /**
     * LLM을 사용하여 로그 분석
     */
    private VocLogAnalysis analyzeLogsWithLlm(
        String vocTitle,
        String vocContent,
        LogAnalysisResult logSearchResult,
        List<String> keywords
    ) {
        try {
            // 로그를 텍스트로 변환
            String logsText = formatLogsForLlm(logSearchResult.logs());

            // LLM 프롬프트 생성
            String prompt = createLogAnalysisPrompt(vocTitle, vocContent, logsText);

            // LLM 호출
            String llmResponse = llmPort.sendPrompt(prompt);

            // 응답 파싱
            return parseLogAnalysisResponse(llmResponse, logSearchResult.logs());

        } catch (Exception e) {
            log.error("Error analyzing logs with LLM", e);
            return VocLogAnalysis.empty("AI 분석 중 오류가 발생했습니다.");
        }
    }

    /**
     * 로그를 LLM이 읽기 쉬운 형식으로 변환
     */
    private String formatLogsForLlm(List<LogEntry> logs) {
        StringBuilder sb = new StringBuilder();
        int count = 0;

        for (LogEntry logEntry : logs) {
            if (count++ >= 20) break; // 최대 20개만 포함

            sb.append(String.format("[%s] [%s] [%s] %s\n",
                logEntry.timestamp().format(TIMESTAMP_FORMATTER),
                logEntry.logLevel(),
                logEntry.serviceName(),
                logEntry.message()
            ));
        }

        return sb.toString();
    }

    /**
     * 로그 분석 프롬프트 생성
     */
    private String createLogAnalysisPrompt(String vocTitle, String vocContent, String logsText) {
        return String.format("""
            You are a log analysis expert. Analyze the following VOC (Voice of Customer) and related system logs to identify the root cause.
            
            VOC Title: %s
            VOC Content: %s
            
            Related System Logs (last 24 hours):
            %s
            
            Please analyze and provide:
            1. A brief summary of the issue (2-3 sentences)
            2. Confidence level (0.0 to 1.0)
            3. Key keywords from the logs
            4. Possible root causes (list of 2-3 items)
            5. Recommendation for resolution
            
            Respond in JSON format:
            {
              "summary": "Brief analysis summary",
              "confidence": 0.85,
              "keywords": ["keyword1", "keyword2"],
              "possibleCauses": ["cause 1", "cause 2"],
              "recommendation": "Suggested action"
            }
            """,
            vocTitle,
            vocContent,
            logsText
        );
    }

    /**
     * LLM 응답을 VocLogAnalysis로 파싱
     */
    private VocLogAnalysis parseLogAnalysisResponse(String llmResponse, List<LogEntry> logs) {
        try {
            // JSON 부분 추출
            String jsonStr = extractJsonFromResponse(llmResponse);
            JsonNode rootNode = objectMapper.readTree(jsonStr);

            // 필드 추출
            String summary = rootNode.get("summary").asText();
            Double confidence = rootNode.get("confidence").asDouble();

            List<String> keywords = new ArrayList<>();
            JsonNode keywordsNode = rootNode.get("keywords");
            if (keywordsNode != null && keywordsNode.isArray()) {
                for (JsonNode keyword : keywordsNode) {
                    keywords.add(keyword.asText());
                }
            }

            List<String> possibleCauses = new ArrayList<>();
            JsonNode causesNode = rootNode.get("possibleCauses");
            if (causesNode != null && causesNode.isArray()) {
                for (JsonNode cause : causesNode) {
                    possibleCauses.add(cause.asText());
                }
            }

            String recommendation = rootNode.get("recommendation").asText();

            // 관련 로그 변환 (상위 5개만)
            List<RelatedLog> relatedLogs = logs.stream()
                .limit(5)
                .map(log -> new RelatedLog(
                    log.timestamp().format(TIMESTAMP_FORMATTER),
                    log.logLevel(),
                    log.serviceName(),
                    log.message(),
                    0.8 // 기본 연관도 점수
                ))
                .collect(Collectors.toList());

            return new VocLogAnalysis(
                summary,
                confidence,
                keywords,
                possibleCauses,
                relatedLogs,
                recommendation
            );

        } catch (Exception e) {
            log.error("Failed to parse LLM log analysis response", e);
            return VocLogAnalysis.empty("AI 응답 파싱 실패");
        }
    }

    /**
     * 응답에서 JSON 부분 추출
     */
    private String extractJsonFromResponse(String response) {
        if (response == null || response.isEmpty()) {
            throw new IllegalArgumentException("Empty response");
        }

        int firstBrace = response.indexOf('{');
        if (firstBrace == -1) {
            throw new IllegalArgumentException("No JSON found in response");
        }

        // 괄호 매칭
        int braceCount = 0;
        boolean inString = false;
        boolean escaped = false;

        for (int i = firstBrace; i < response.length(); i++) {
            char c = response.charAt(i);

            if (escaped) {
                escaped = false;
                continue;
            }

            if (c == '\\' && inString) {
                escaped = true;
                continue;
            }

            if (c == '"') {
                inString = !inString;
                continue;
            }

            if (!inString) {
                if (c == '{') {
                    braceCount++;
                } else if (c == '}') {
                    braceCount--;
                    if (braceCount == 0) {
                        return response.substring(firstBrace, i + 1);
                    }
                }
            }
        }

        throw new IllegalArgumentException("Unbalanced braces in response");
    }
}
