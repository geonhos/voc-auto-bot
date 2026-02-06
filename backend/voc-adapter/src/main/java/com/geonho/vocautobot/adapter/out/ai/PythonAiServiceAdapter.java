package com.geonho.vocautobot.adapter.out.ai;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.AnalysisMethod;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.ConfidenceBreakdown;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.ConfidenceDetails;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.ConfidenceLevel;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.RelatedLog;
import com.geonho.vocautobot.application.analysis.port.out.AiAnalysisPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
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
public class PythonAiServiceAdapter implements AiAnalysisPort {

    private static final Logger log = LoggerFactory.getLogger(PythonAiServiceAdapter.class);

    private final RestTemplate aiServiceRestTemplate;
    private final PythonAiServiceConfig config;

    public PythonAiServiceAdapter(
            @Qualifier("aiServiceRestTemplate") RestTemplate aiServiceRestTemplate,
            PythonAiServiceConfig config) {
        this.aiServiceRestTemplate = aiServiceRestTemplate;
        this.config = config;
        log.info("PythonAiServiceAdapter initialized with custom RestTemplate (timeout configured)");
    }

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

        // Determine confidence level from confidence score
        ConfidenceLevel confidenceLevel = VocLogAnalysis.determineConfidenceLevel(response.confidence);

        // Parse analysis method (null-safe)
        AnalysisMethod analysisMethod = parseAnalysisMethod(response.analysisMethod);

        // Parse confidence details (null-safe)
        ConfidenceDetails confidenceDetails = parseConfidenceDetails(response.confidenceDetails);

        return new VocLogAnalysis(
            response.summary,
            response.confidence,
            response.keywords,
            response.possibleCauses,
            relatedLogs,
            response.recommendation,
            confidenceLevel,
            analysisMethod,
            response.vectorMatchCount,
            confidenceDetails
        );
    }

    /**
     * analysisMethod 문자열을 AnalysisMethod enum으로 변환
     */
    private AnalysisMethod parseAnalysisMethod(String methodValue) {
        if (methodValue == null) {
            return null;
        }
        return AnalysisMethod.fromValue(methodValue);
    }

    /**
     * ConfidenceDetails DTO를 record로 변환
     */
    private ConfidenceDetails parseConfidenceDetails(ConfidenceDetailsDto dto) {
        if (dto == null) {
            return null;
        }

        ConfidenceLevel level = null;
        if (dto.level != null) {
            try {
                level = ConfidenceLevel.valueOf(dto.level);
            } catch (IllegalArgumentException e) {
                log.warn("Unknown confidence level: {}", dto.level);
            }
        }

        ConfidenceBreakdown breakdown = null;
        if (dto.breakdown != null) {
            breakdown = new ConfidenceBreakdown(
                dto.breakdown.vectorMatchScore,
                dto.breakdown.similarityScore,
                dto.breakdown.responseCompleteness,
                dto.breakdown.categoryMatchScore
            );
        }

        return new ConfidenceDetails(
            level,
            dto.score,
            breakdown,
            dto.factors
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
        // Enhanced fields
        public String analysisMethod;
        public Integer vectorMatchCount;
        public ConfidenceDetailsDto confidenceDetails;
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

    /**
     * 신뢰도 상세 정보 DTO
     */
    private static class ConfidenceDetailsDto {
        public String level;
        public Double score;
        public ConfidenceBreakdownDto breakdown;
        public List<String> factors;
    }

    /**
     * 신뢰도 breakdown DTO
     */
    private static class ConfidenceBreakdownDto {
        public Double vectorMatchScore;
        public Double similarityScore;
        public Double responseCompleteness;
        public Double categoryMatchScore;
    }
}
