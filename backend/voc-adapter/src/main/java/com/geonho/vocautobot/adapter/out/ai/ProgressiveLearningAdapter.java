package com.geonho.vocautobot.adapter.out.ai;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;
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
 * 점진적 학습 어댑터 구현
 *
 * Python AI 서비스의 /api/v1/learn 엔드포인트를 호출하여
 * 완료된 VOC를 벡터 DB에 저장합니다.
 */
@Component
@RequiredArgsConstructor
public class ProgressiveLearningAdapter implements ProgressiveLearningPort {

    private static final Logger log = LoggerFactory.getLogger(ProgressiveLearningAdapter.class);

    private final RestTemplate aiServiceRestTemplate;
    private final PythonAiServiceConfig config;

    /**
     * 완료된 VOC로부터 학습
     *
     * 비동기로 처리되어 VOC 완료 처리에 영향을 주지 않습니다.
     *
     * @param vocId VOC 식별자
     * @param title VOC 제목
     * @param content VOC 내용
     * @param resolution 해결 방법/내용
     * @param analysisResult 원본 AI 분석 결과
     * @return 학습 성공 여부
     */
    @Override
    @Async("progressiveLearningExecutor")
    public boolean learnFromResolvedVoc(
        String vocId,
        String title,
        String content,
        String resolution,
        VocLogAnalysis analysisResult
    ) {
        log.info("Starting progressive learning for VOC: {}", vocId);

        try {
            // 요청 본문 생성
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("voc_id", vocId);
            requestBody.put("title", title);
            requestBody.put("content", content);
            requestBody.put("resolution", resolution);

            // 분석 결과가 있으면 포함
            if (analysisResult != null) {
                Map<String, Object> analysisMap = new HashMap<>();
                analysisMap.put("summary", analysisResult.summary());
                analysisMap.put("confidence", analysisResult.confidence());
                analysisMap.put("keywords", analysisResult.keywords());
                analysisMap.put("possibleCauses", analysisResult.possibleCauses());
                analysisMap.put("recommendation", analysisResult.recommendation());
                requestBody.put("analysis_result", analysisMap);
            }

            // HTTP 헤더 설정
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            // Python AI 서비스의 learn 엔드포인트 호출
            String learnUrl = config.getUrl() + "/api/v1/learn";
            log.debug("Calling progressive learning API at: {}", learnUrl);

            ResponseEntity<LearnResponse> response = aiServiceRestTemplate.postForEntity(
                learnUrl,
                requestEntity,
                LearnResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                LearnResponse learnResponse = response.getBody();
                boolean success = "completed".equals(learnResponse.status);

                if (success) {
                    log.info(
                        "Progressive learning completed for VOC {}: seeded {} entries",
                        vocId,
                        learnResponse.seededEntries
                    );
                } else {
                    log.warn(
                        "Progressive learning partially failed for VOC {}: {}",
                        vocId,
                        learnResponse.errorMessage
                    );
                }

                return success;
            } else {
                log.warn(
                    "Progressive learning API returned non-success status: {}",
                    response.getStatusCode()
                );
                return false;
            }

        } catch (RestClientException e) {
            log.error("Failed to call progressive learning API for VOC {}", vocId, e);
            return false;
        } catch (Exception e) {
            log.error("Unexpected error during progressive learning for VOC {}", vocId, e);
            return false;
        }
    }

    /**
     * 학습 서비스 사용 가능 여부 확인
     */
    @Override
    public boolean isAvailable() {
        try {
            String healthUrl = config.getUrl() + "/health";
            ResponseEntity<Map> response = aiServiceRestTemplate.getForEntity(
                healthUrl,
                Map.class
            );

            return response.getStatusCode().is2xxSuccessful()
                && response.getBody() != null
                && "healthy".equals(response.getBody().get("status"));

        } catch (Exception e) {
            log.warn("Progressive learning service health check failed", e);
            return false;
        }
    }

    /**
     * 학습 API 응답 DTO
     */
    private static class LearnResponse {
        public String status;
        public int totalEntries;
        public int seededEntries;
        public int failedEntries;
        public String startedAt;
        public String completedAt;
        public String errorMessage;
    }
}
