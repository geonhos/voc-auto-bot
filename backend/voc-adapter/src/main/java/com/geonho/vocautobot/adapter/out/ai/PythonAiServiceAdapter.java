package com.geonho.vocautobot.adapter.out.ai;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.AnalysisMethod;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.ConfidenceBreakdown;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.ConfidenceDetails;
import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis.ConfidenceLevel;
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
        // 관련 로그 변환
        List<RelatedLog> relatedLogs = response.relatedLogs != null
            ? response.relatedLogs.stream()
                .map(logDto -> new RelatedLog(
                    logDto.timestamp,
                    logDto.logLevel,
                    logDto.serviceName,
                    logDto.message,
                    logDto.relevanceScore
                ))
                .collect(Collectors.toList())
            : List.of();

        // 신뢰도 레벨 변환 (null 안전 처리)
        ConfidenceLevel confidenceLevel = parseConfidenceLevel(response.confidenceLevel);

        // 분석 방법 변환 (null 안전 처리)
        AnalysisMethod analysisMethod = parseAnalysisMethod(response.analysisMethod);

        // 신뢰도 상세 정보 변환 (null 안전 처리)
        ConfidenceDetails confidenceDetails = convertConfidenceDetails(response.confidenceDetails);

        return new VocLogAnalysis(
            response.summary,
            response.confidence,
            response.keywords != null ? response.keywords : List.of(),
            response.possibleCauses != null ? response.possibleCauses : List.of(),
            relatedLogs,
            response.recommendation,
            confidenceLevel,
            analysisMethod,
            response.vectorMatchCount,
            confidenceDetails
        );
    }

    /**
     * 문자열에서 ConfidenceLevel 파싱 (null 안전)
     */
    private ConfidenceLevel parseConfidenceLevel(String value) {
        if (value == null) {
            return null;
        }
        return ConfidenceLevel.fromValue(value);
    }

    /**
     * 문자열에서 AnalysisMethod 파싱 (null 안전)
     */
    private AnalysisMethod parseAnalysisMethod(String value) {
        if (value == null) {
            return null;
        }
        return AnalysisMethod.fromValue(value);
    }

    /**
     * ConfidenceDetails 변환 (null 안전)
     */
    private ConfidenceDetails convertConfidenceDetails(ConfidenceDetailsDto dto) {
        if (dto == null) {
            return null;
        }

        ConfidenceLevel level = parseConfidenceLevel(dto.level);
        List<String> factors = dto.factors != null ? dto.factors : List.of();
        ConfidenceBreakdown breakdown = convertConfidenceBreakdown(dto.breakdown);

        return new ConfidenceDetails(level, factors, breakdown);
    }

    /**
     * ConfidenceBreakdown 변환 (null 안전)
     */
    private ConfidenceBreakdown convertConfidenceBreakdown(ConfidenceBreakdownDto dto) {
        if (dto == null) {
            return null;
        }

        return new ConfidenceBreakdown(
            dto.vectorMatchScore,
            dto.vectorMatchCountScore,
            dto.llmResponseScore,
            dto.methodWeight
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
        public String confidenceLevel;
        public ConfidenceDetailsDto confidenceDetails;
        public Integer vectorMatchCount;
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
        public List<String> factors;
        public ConfidenceBreakdownDto breakdown;
    }

    /**
     * 신뢰도 breakdown DTO
     */
    private static class ConfidenceBreakdownDto {
        public Double vectorMatchScore;
        public Double vectorMatchCountScore;
        public Double llmResponseScore;
        public Double methodWeight;
    }
}
