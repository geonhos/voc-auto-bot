package com.geonho.vocautobot.adapter.out.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.adapter.out.ai.exception.LlmIntegrationException;
import com.geonho.vocautobot.adapter.out.ai.exception.LlmIntegrationException.ErrorType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.Map;

/**
 * Embedding Service
 * Ollama API를 통한 텍스트 임베딩 생성
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);
    private static final String EMBED_ENDPOINT = "/api/embed";
    private static final String DEFAULT_EMBEDDING_MODEL = "nomic-embed-text";

    private final WebClient webClient;
    private final OllamaConfig config;
    private final ObjectMapper objectMapper;

    public EmbeddingService(
            WebClient ollamaWebClient,
            OllamaConfig config,
            ObjectMapper objectMapper) {
        this.webClient = ollamaWebClient;
        this.config = config;
        this.objectMapper = objectMapper;
    }

    /**
     * 텍스트를 임베딩 벡터로 변환
     *
     * @param text 임베딩할 텍스트
     * @return 임베딩 벡터 (float 배열)
     */
    public float[] generateEmbedding(String text) {
        log.debug("Generating embedding for text of length: {}", text.length());

        try {
            Map<String, Object> requestBody = Map.of(
                    "model", DEFAULT_EMBEDDING_MODEL,
                    "input", text
            );

            String response = webClient
                    .post()
                    .uri(EMBED_ENDPOINT)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(config.getTimeout()))
                    .retryWhen(Retry.backoff(config.getMaxRetries(), Duration.ofMillis(500))
                            .filter(this::isRetryableException)
                            .doBeforeRetry(retrySignal ->
                                log.warn("Retrying embedding API call, attempt: {}",
                                    retrySignal.totalRetries() + 1))
                            .onRetryExhaustedThrow((retryBackoffSpec, retrySignal) ->
                                new LlmIntegrationException(ErrorType.NETWORK_ERROR,
                                    "최대 재시도 횟수(" + config.getMaxRetries() + ")를 초과했습니다",
                                    retrySignal.failure())))
                    .onErrorMap(e -> !(e instanceof LlmIntegrationException),
                            e -> new LlmIntegrationException(ErrorType.NETWORK_ERROR, e.getMessage(), e))
                    .block();

            return parseEmbeddingResponse(response);

        } catch (LlmIntegrationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error generating embedding", e);
            throw new LlmIntegrationException(ErrorType.NETWORK_ERROR, "임베딩 생성 오류", e);
        }
    }

    /**
     * 여러 텍스트를 한 번에 임베딩
     *
     * @param texts 임베딩할 텍스트 배열
     * @return 임베딩 벡터 배열
     */
    public float[][] generateEmbeddings(String[] texts) {
        log.debug("Generating embeddings for {} texts", texts.length);

        float[][] embeddings = new float[texts.length][];
        for (int i = 0; i < texts.length; i++) {
            embeddings[i] = generateEmbedding(texts[i]);
        }

        return embeddings;
    }

    /**
     * 재시도 가능한 예외인지 확인
     */
    private boolean isRetryableException(Throwable throwable) {
        return throwable instanceof WebClientRequestException
                || throwable instanceof java.net.ConnectException
                || throwable instanceof java.io.IOException;
    }

    /**
     * Ollama 임베딩 응답 파싱
     * 응답 형식: {"embeddings": [[0.1, 0.2, ...]]}
     */
    private float[] parseEmbeddingResponse(String response) {
        try {
            JsonNode rootNode = objectMapper.readTree(response);

            // Ollama의 embed API는 "embeddings" 배열을 반환
            // 단일 텍스트인 경우 첫 번째 임베딩만 사용
            JsonNode embeddingsNode = rootNode.get("embeddings");
            if (embeddingsNode == null || !embeddingsNode.isArray() || embeddingsNode.isEmpty()) {
                throw new LlmIntegrationException(ErrorType.INVALID_RESPONSE,
                    "임베딩 응답에 embeddings 배열이 없습니다");
            }

            JsonNode embeddingNode = embeddingsNode.get(0);
            if (embeddingNode == null || !embeddingNode.isArray()) {
                throw new LlmIntegrationException(ErrorType.INVALID_RESPONSE,
                    "임베딩 데이터가 유효하지 않습니다");
            }

            int size = embeddingNode.size();
            float[] embedding = new float[size];

            for (int i = 0; i < size; i++) {
                embedding[i] = (float) embeddingNode.get(i).asDouble();
            }

            log.debug("Successfully parsed embedding vector of dimension: {}", size);
            return embedding;

        } catch (LlmIntegrationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to parse embedding response: {}", response, e);
            throw new LlmIntegrationException(ErrorType.PARSING_ERROR,
                "임베딩 응답 파싱 실패", e);
        }
    }

    /**
     * 사용 가능한 임베딩 모델 확인
     *
     * @return 임베딩 모델명
     */
    public String getEmbeddingModel() {
        return DEFAULT_EMBEDDING_MODEL;
    }

    /**
     * 임베딩 차원 수 조회
     * nomic-embed-text 모델의 기본 차원은 768
     * 필요시 설정으로 변경 가능
     *
     * @return 임베딩 벡터 차원 수
     */
    public int getEmbeddingDimension() {
        // nomic-embed-text의 기본 차원은 768
        // 실제 응답에서 동적으로 확인하는 것이 더 안전
        return 768;
    }
}
