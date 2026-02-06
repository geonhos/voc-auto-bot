package com.geonho.vocautobot.adapter.out.ai;

import com.geonho.vocautobot.application.analysis.port.out.ProgressiveLearningPort;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 점진적 학습 어댑터
 * VOC가 해결되면 AI 서비스에 학습 요청을 전송하여
 * 벡터 데이터베이스를 점진적으로 확장합니다.
 */
@Component
@RequiredArgsConstructor
public class ProgressiveLearningAdapter implements ProgressiveLearningPort {

    private static final Logger log = LoggerFactory.getLogger(ProgressiveLearningAdapter.class);
    private static final String LEARN_ENDPOINT = "/api/v1/learn";

    private final RestTemplate aiServiceRestTemplate;
    private final PythonAiServiceConfig config;

    /**
     * 해결된 VOC로부터 학습합니다.
     *
     * @param vocId      VOC 식별자
     * @param title      VOC 제목
     * @param content    VOC 내용
     * @param resolution 적용된 해결 방법/조치
     * @param category   VOC 카테고리
     * @return 학습 성공 여부
     */
    @Override
    public boolean learnFromResolvedVoc(
        Long vocId,
        String title,
        String content,
        String resolution,
        String category
    ) {
        log.info("Sending progressive learning request for VOC: {}", vocId);

        try {
            // 요청 본문 생성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("voc_id", String.valueOf(vocId));
            requestBody.put("title", title);
            requestBody.put("content", content);
            requestBody.put("resolution", resolution);
            requestBody.put("category", category != null ? category : "unknown");

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            // AI 서비스 호출
            String learnUrl = config.getUrl() + LEARN_ENDPOINT;
            log.debug("Calling AI learning endpoint: {}", learnUrl);

            ResponseEntity<LearnResponse> response = aiServiceRestTemplate.postForEntity(
                learnUrl,
                requestEntity,
                LearnResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                boolean success = response.getBody().success;
                if (success) {
                    log.info("Progressive learning completed for VOC: {}", vocId);
                } else {
                    log.warn("Progressive learning reported failure for VOC: {} - {}",
                        vocId, response.getBody().message);
                }
                return success;
            } else {
                log.warn("AI service returned non-success status for learning: {}",
                    response.getStatusCode());
                return false;
            }

        } catch (RestClientException e) {
            log.error("Failed to call AI learning service for VOC: {}", vocId, e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error during progressive learning for VOC: {}", vocId, e);
            return false;
        }
    }

    /**
     * 해결된 VOC로부터 비동기로 학습합니다.
     * 학습 실패가 메인 비즈니스 로직에 영향을 주지 않습니다.
     */
    @Override
    @Async
    public void learnFromResolvedVocAsync(
        Long vocId,
        String title,
        String content,
        String resolution,
        String category
    ) {
        log.debug("Starting async progressive learning for VOC: {}", vocId);
        try {
            boolean success = learnFromResolvedVoc(vocId, title, content, resolution, category);
            if (!success) {
                log.warn("Async progressive learning failed for VOC: {}", vocId);
            }
        } catch (Exception e) {
            // 비동기 처리이므로 예외를 로그로만 기록하고 전파하지 않음
            log.error("Async progressive learning error for VOC: {}", vocId, e);
        }
    }

    /**
     * 학습 응답 DTO
     */
    private static class LearnResponse {
        public boolean success;
        public String message;
    }
}
