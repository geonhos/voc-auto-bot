package com.geonho.vocautobot.adapter.out.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.adapter.out.ai.exception.LlmIntegrationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmbeddingServiceTest {

    @Mock
    private WebClient webClient;

    @Mock
    private WebClient.RequestBodyUriSpec requestBodyUriSpec;

    @Mock
    private WebClient.RequestBodySpec requestBodySpec;

    @Mock
    private WebClient.ResponseSpec responseSpec;

    private OllamaConfig config;
    private ObjectMapper objectMapper;
    private EmbeddingService embeddingService;

    @BeforeEach
    void setUp() {
        config = new OllamaConfig();
        config.setBaseUrl("http://localhost:11434");
        config.setTimeout(30000);
        config.setMaxRetries(3);

        objectMapper = new ObjectMapper();
        embeddingService = new EmbeddingService(webClient, config, objectMapper);
    }

    @Test
    @DisplayName("텍스트를 임베딩 벡터로 변환 성공")
    void generateEmbedding_shouldReturnEmbeddingVector() {
        // given
        String text = "테스트 VOC 내용입니다";
        String mockResponse = """
            {
                "model": "nomic-embed-text",
                "embeddings": [[0.1, 0.2, 0.3, 0.4, 0.5]]
            }
            """;

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(mockResponse));

        // when
        float[] result = embeddingService.generateEmbedding(text);

        // then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(5);
        assertThat(result[0]).isEqualTo(0.1f);
        assertThat(result[4]).isEqualTo(0.5f);

        verify(webClient).post();
    }

    @Test
    @DisplayName("임베딩 응답이 유효하지 않으면 예외 발생")
    void generateEmbedding_withInvalidResponse_shouldThrowException() {
        // given
        String text = "테스트 VOC 내용입니다";
        String invalidResponse = """
            {
                "model": "nomic-embed-text"
            }
            """;

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(invalidResponse));

        // when & then
        assertThatThrownBy(() -> embeddingService.generateEmbedding(text))
                .isInstanceOf(LlmIntegrationException.class)
                .hasMessageContaining("embeddings 배열이 없습니다");
    }

    @Test
    @DisplayName("여러 텍스트를 한 번에 임베딩")
    void generateEmbeddings_shouldReturnMultipleVectors() {
        // given
        String[] texts = {"첫 번째 텍스트", "두 번째 텍스트"};
        String mockResponse = """
            {
                "model": "nomic-embed-text",
                "embeddings": [[0.1, 0.2, 0.3]]
            }
            """;

        when(webClient.post()).thenReturn(requestBodyUriSpec);
        when(requestBodyUriSpec.uri(anyString())).thenReturn(requestBodySpec);
        when(requestBodySpec.bodyValue(any())).thenReturn(requestBodySpec);
        when(requestBodySpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.bodyToMono(String.class)).thenReturn(Mono.just(mockResponse));

        // when
        float[][] results = embeddingService.generateEmbeddings(texts);

        // then
        assertThat(results).hasSize(2);
        assertThat(results[0]).hasSize(3);
        assertThat(results[1]).hasSize(3);

        verify(webClient, times(2)).post();
    }

    @Test
    @DisplayName("임베딩 모델명 조회")
    void getEmbeddingModel_shouldReturnModelName() {
        // when
        String model = embeddingService.getEmbeddingModel();

        // then
        assertThat(model).isEqualTo("nomic-embed-text");
    }

    @Test
    @DisplayName("임베딩 차원 수 조회")
    void getEmbeddingDimension_shouldReturnDimension() {
        // when
        int dimension = embeddingService.getEmbeddingDimension();

        // then
        assertThat(dimension).isEqualTo(768);
    }
}
