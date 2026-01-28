package com.geonho.vocautobot.adapter.out.ai;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.RelatedLog;
import com.geonho.vocautobot.application.analysis.port.out.AiAnalysisPort;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Python AI 서비스 어댑터
 * FastAPI 기반 AI 로그 분석 서비스를 호출
 */
@Component
@RequiredArgsConstructor
public class PythonAiServiceAdapter implements AiAnalysisPort {

    private static final Logger log = LoggerFactory.getLogger(PythonAiServiceAdapter.class);

    private final RestTemplate aiServiceRestTemplate;
    private final PythonAiServiceConfig config;

    /**
     * Python AI 서비스를 호출하여 VOC 로그 분석 수행
     *
     * @param vocTitle   VOC 제목
     * @param vocContent VOC 내용
     * @return AI 분석 결과
     */
    @Override
    public VocLogAnalysis analyzeVoc(String vocTitle, String vocContent) {
        log.info("Calling Python AI service for VOC analysis: {}", vocTitle);

        try {
            // 요청 본문 생성
            Map<String, String> requestBody = Map.of(
                "title", vocTitle,
                "content", vocContent
            );

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

            // Python AI 서비스 호출
            String analyzeUrl = config.getAnalyzeUrl();
            log.debug("Calling AI service at: {}", analyzeUrl);

            ResponseEntity<PythonAiResponse> response = aiServiceRestTemplate.postForEntity(
                analyzeUrl,
                requestEntity,
                PythonAiResponse.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("AI service returned non-success status: {}", response.getStatusCode());
                return VocLogAnalysis.empty("AI 서비스가 정상 응답을 반환하지 않았습니다.");
            }

            // 응답을 VocLogAnalysis로 변환
            PythonAiResponse aiResponse = response.getBody();
            return convertToVocLogAnalysis(aiResponse);

        } catch (RestClientException e) {
            log.error("Failed to call Python AI service", e);
            return VocLogAnalysis.empty("AI 서비스 호출 중 오류가 발생했습니다: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during AI service call", e);
            return VocLogAnalysis.empty("AI 분석 중 예상치 못한 오류가 발생했습니다.");
        }
    }

    /**
     * Python AI 서비스 응답을 VocLogAnalysis로 변환
     */
    private VocLogAnalysis convertToVocLogAnalysis(PythonAiResponse response) {
        List<RelatedLog> relatedLogs = response.relatedLogs.stream()
            .map(log -> new RelatedLog(
                log.timestamp,
                log.logLevel,
                log.serviceName,
                log.message,
                log.relevanceScore
            ))
            .collect(Collectors.toList());

        return new VocLogAnalysis(
            response.summary,
            response.confidence,
            response.keywords,
            response.possibleCauses,
            relatedLogs,
            response.recommendation
        );
    }

    /**
     * Python AI 서비스 응답 DTO
     */
    private static class PythonAiResponse {
        public String summary;
        public Double confidence;
        public List<String> keywords;
        public List<String> possibleCauses;
        public List<RelatedLogDto> relatedLogs;
        public String recommendation;
    }

    /**
     * 관련 로그 DTO
     */
    private static class RelatedLogDto {
        public String timestamp;
        public String logLevel;
        public String serviceName;
        public String message;
        public Double relevanceScore;
    }
}
