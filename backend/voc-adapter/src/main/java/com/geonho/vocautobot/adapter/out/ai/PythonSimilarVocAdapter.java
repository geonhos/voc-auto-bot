package com.geonho.vocautobot.adapter.out.ai;

import com.geonho.vocautobot.application.voc.port.out.SimilarVocPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Adapter for communicating with the Python AI service for similar VOC search.
 * Implements the SimilarVocPort interface following Hexagonal Architecture.
 */
@Component
public class PythonSimilarVocAdapter implements SimilarVocPort {

    private static final Logger log = LoggerFactory.getLogger(PythonSimilarVocAdapter.class);

    private final RestTemplate aiServiceRestTemplate;
    private final PythonAiServiceConfig config;

    public PythonSimilarVocAdapter(
            @Qualifier("aiServiceRestTemplate") RestTemplate aiServiceRestTemplate,
            PythonAiServiceConfig config) {
        this.aiServiceRestTemplate = aiServiceRestTemplate;
        this.config = config;
        log.info("PythonSimilarVocAdapter initialized");
    }

    @Override
    public List<SimilarVocResult> findSimilarVocs(Long vocId, String content, int limit) {
        log.info("Searching similar VOCs for VOC ID: {} (limit: {})", vocId, limit);

        try {
            Map<String, Object> requestBody = Map.of(
                    "query_text", content,
                    "limit", limit
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            String similarUrl = config.getUrl() + "/api/v1/similar";
            log.debug("Calling similar VOC API at: {}", similarUrl);

            ResponseEntity<SimilarVocSearchResponseDto> response = aiServiceRestTemplate.postForEntity(
                    similarUrl,
                    requestEntity,
                    SimilarVocSearchResponseDto.class
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                log.warn("Similar VOC API returned non-success status: {}", response.getStatusCode());
                return Collections.emptyList();
            }

            SimilarVocSearchResponseDto responseBody = response.getBody();
            if (responseBody.results == null) {
                return Collections.emptyList();
            }

            return responseBody.results.stream()
                    .map(item -> new SimilarVocResult(
                            item.vocId,
                            item.similarity
                    ))
                    .collect(Collectors.toList());

        } catch (RestClientException e) {
            log.error("Failed to call similar VOC API for VOC ID: {}", vocId, e);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unexpected error during similar VOC search for VOC ID: {}", vocId, e);
            return Collections.emptyList();
        }
    }

    @Override
    @Async("vocIndexingExecutor")
    public boolean indexVoc(Long vocId, String title, String content, String category) {
        log.info("Indexing VOC ID: {} into vector database", vocId);

        try {
            Map<String, Object> requestBody = new java.util.HashMap<>();
            requestBody.put("voc_id", vocId);
            requestBody.put("title", title);
            requestBody.put("content", content);
            if (category != null) {
                requestBody.put("category", category);
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            String indexUrl = config.getUrl() + "/api/v1/voc/index";
            log.debug("Calling VOC indexing API at: {}", indexUrl);

            ResponseEntity<VocIndexResponseDto> response = aiServiceRestTemplate.postForEntity(
                    indexUrl,
                    requestEntity,
                    VocIndexResponseDto.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.info("Successfully indexed VOC ID: {}", vocId);
                return true;
            } else {
                log.warn("VOC indexing API returned non-success status: {}", response.getStatusCode());
                return false;
            }

        } catch (RestClientException e) {
            log.error("Failed to call VOC indexing API for VOC ID: {}", vocId, e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error during VOC indexing for VOC ID: {}", vocId, e);
            return false;
        }
    }

    /**
     * Response DTO for similar VOC search
     */
    private static class SimilarVocSearchResponseDto {
        public List<SimilarVocItemDto> results;
    }

    /**
     * Single similar VOC item DTO
     */
    private static class SimilarVocItemDto {
        public Long vocId;
        public Double similarity;
        public String title;

        // Jackson snake_case support
        public void setVoc_id(Long vocId) {
            this.vocId = vocId;
        }
    }

    /**
     * Response DTO for VOC indexing
     */
    private static class VocIndexResponseDto {
        public String status;
        public Long vocId;
        public String message;

        // Jackson snake_case support
        public void setVoc_id(Long vocId) {
            this.vocId = vocId;
        }
    }
}
