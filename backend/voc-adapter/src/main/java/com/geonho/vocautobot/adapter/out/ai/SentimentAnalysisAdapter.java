package com.geonho.vocautobot.adapter.out.ai;

import com.geonho.vocautobot.application.analysis.port.out.SentimentAnalysisPort;
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

import java.util.HashMap;
import java.util.Map;

/**
 * Python AI 서비스의 감성 분석 엔드포인트 호출
 */
@Component
public class SentimentAnalysisAdapter implements SentimentAnalysisPort {

    private static final Logger log = LoggerFactory.getLogger(SentimentAnalysisAdapter.class);

    private final RestTemplate aiServiceRestTemplate;
    private final PythonAiServiceConfig config;

    public SentimentAnalysisAdapter(
            @Qualifier("aiServiceRestTemplate") RestTemplate aiServiceRestTemplate,
            PythonAiServiceConfig config) {
        this.aiServiceRestTemplate = aiServiceRestTemplate;
        this.config = config;
    }

    @Override
    public SentimentResult analyze(String text) {
        try {
            Map<String, String> requestBody = Map.of("text", text);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);

            String sentimentUrl = config.getUrl() + "/api/v1/sentiment";
            log.debug("Calling sentiment analysis at: {}", sentimentUrl);

            ResponseEntity<SentimentResponse> response = aiServiceRestTemplate.postForEntity(
                    sentimentUrl, requestEntity, SentimentResponse.class);

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Sentiment analysis returned non-success: {}", response.getStatusCode());
                return new SentimentResult("neutral", 0.5, Map.of());
            }

            SentimentResponse body = response.getBody();
            return new SentimentResult(
                    body.sentiment != null ? body.sentiment : "neutral",
                    body.confidence != null ? body.confidence : 0.5,
                    body.emotions != null ? body.emotions : Map.of()
            );
        } catch (RestClientException e) {
            log.error("Failed to call sentiment analysis service: {}", e.getMessage());
            return new SentimentResult("neutral", 0.5, Map.of());
        }
    }

    private static class SentimentResponse {
        public String sentiment;
        public Double confidence;
        public Map<String, Double> emotions;
    }
}
