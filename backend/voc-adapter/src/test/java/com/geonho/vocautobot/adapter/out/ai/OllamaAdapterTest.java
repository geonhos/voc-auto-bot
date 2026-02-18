package com.geonho.vocautobot.adapter.out.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("OllamaAdapter 테스트")
class OllamaAdapterTest {

    private MockWebServer mockWebServer;
    private OllamaAdapter ollamaAdapter;
    private OllamaConfig config;
    private PromptTemplate promptTemplate;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        config = new OllamaConfig();
        config.setBaseUrl(mockWebServer.url("/").toString());
        config.setModel("exaone3.5:7.8b");
        config.setTimeout(5000);

        WebClient webClient = WebClient.builder()
                .baseUrl(config.getBaseUrl())
                .build();

        promptTemplate = new PromptTemplate();
        objectMapper = new ObjectMapper();

        ollamaAdapter = new OllamaAdapter(webClient, config, promptTemplate, objectMapper);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    @DisplayName("VOC 분석 성공")
    void analyzeVoc_shouldReturnAnalysisResult() throws InterruptedException {
        // given
        String llmResponseJson = """
                {
                  "categorySuggestions": [
                    {
                      "categoryName": "버그 리포트",
                      "confidence": 0.9,
                      "reason": "로그인 기능 오류"
                    }
                  ],
                  "prioritySuggestion": {
                    "priority": "HIGH",
                    "confidence": 0.85,
                    "reason": "사용자 접근성에 직접적 영향"
                  },
                  "keywords": ["로그인", "크롬", "버그"],
                  "sentiment": "NEGATIVE",
                  "similarVocs": []
                }
                """;

        String ollamaResponse = String.format("""
                {
                  "model": "exaone3.5:7.8b",
                  "response": "%s"
                }
                """, llmResponseJson.replace("\n", "\\n").replace("\"", "\\\""));

        mockWebServer.enqueue(new MockResponse()
                .setBody(ollamaResponse)
                .addHeader("Content-Type", "application/json"));

        // when
        VocAnalysisResult result = ollamaAdapter.analyzeVoc(
                "크롬 브라우저에서 로그인 버튼을 클릭해도 반응이 없습니다.",
                "로그인이 안됩니다"
        );

        // then
        assertThat(result).isNotNull();
        assertThat(result.getCategorySuggestions()).hasSize(1);
        assertThat(result.getCategorySuggestions().get(0).getCategoryName())
                .isEqualTo("버그 리포트");
        assertThat(result.getPrioritySuggestion().getPriority()).isEqualTo("HIGH");
        assertThat(result.getKeywords()).containsExactly("로그인", "크롬", "버그");
        assertThat(result.getSentiment()).isEqualTo("NEGATIVE");

        // Verify request
        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getPath()).isEqualTo("/api/generate");
        assertThat(request.getMethod()).isEqualTo("POST");
    }

    @Test
    @DisplayName("일반 프롬프트 전송 성공")
    void sendPrompt_shouldReturnResponse() throws InterruptedException {
        // given
        String expectedResponse = "This is a test response";
        String ollamaResponse = String.format("""
                {
                  "model": "exaone3.5:7.8b",
                  "response": "%s"
                }
                """, expectedResponse);

        mockWebServer.enqueue(new MockResponse()
                .setBody(ollamaResponse)
                .addHeader("Content-Type", "application/json"));

        // when
        String result = ollamaAdapter.sendPrompt("test prompt");

        // then
        assertThat(result).isEqualTo(expectedResponse);

        RecordedRequest request = mockWebServer.takeRequest();
        assertThat(request.getPath()).isEqualTo("/api/generate");
    }

    @Test
    @DisplayName("네트워크 오류 시 예외 발생")
    void sendPrompt_shouldThrowException_whenNetworkError() {
        // given
        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(500)
                .setBody("Internal Server Error"));

        // when & then
        assertThatThrownBy(() -> ollamaAdapter.sendPrompt("test prompt"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("네트워크 오류");
    }

    @Test
    @DisplayName("잘못된 JSON 응답 시 예외 발생")
    void analyzeVoc_shouldThrowException_whenInvalidJsonResponse() {
        // given
        String invalidOllamaResponse = """
                {
                  "model": "exaone3.5:7.8b",
                  "response": "invalid json"
                }
                """;

        mockWebServer.enqueue(new MockResponse()
                .setBody(invalidOllamaResponse)
                .addHeader("Content-Type", "application/json"));

        // when & then
        assertThatThrownBy(() -> ollamaAdapter.analyzeVoc("content", "title"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("LLM 응답 파싱 실패");
    }
}
