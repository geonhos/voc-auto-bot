package com.geonho.vocautobot.adapter.out.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult.CategorySuggestion;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult.PrioritySuggestion;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult.SimilarVoc;
import com.geonho.vocautobot.application.analysis.port.out.LlmPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Ollama LLM Adapter
 * LlmPort를 구현하여 Ollama API와 연동
 */
@Component
public class OllamaAdapter implements LlmPort {

    private static final Logger log = LoggerFactory.getLogger(OllamaAdapter.class);
    private static final String GENERATE_ENDPOINT = "/api/generate";

    private final WebClient webClient;
    private final OllamaConfig config;
    private final PromptTemplate promptTemplate;
    private final ObjectMapper objectMapper;

    public OllamaAdapter(
            WebClient ollamaWebClient,
            OllamaConfig config,
            PromptTemplate promptTemplate,
            ObjectMapper objectMapper) {
        this.webClient = ollamaWebClient;
        this.config = config;
        this.promptTemplate = promptTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public VocAnalysisResult analyzeVoc(String vocContent, String vocTitle) {
        log.info("Analyzing VOC with Ollama - Title: {}", vocTitle);

        String prompt = promptTemplate.createVocAnalysisPrompt(vocTitle, vocContent);
        String llmResponse = sendPrompt(prompt);

        return parseAnalysisResponse(llmResponse);
    }

    @Override
    public String sendPrompt(String prompt) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "model", config.getModel(),
                    "prompt", prompt,
                    "stream", false
            );

            String response = webClient
                    .post()
                    .uri(GENERATE_ENDPOINT)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(config.getTimeout()))
                    .onErrorResume(e -> {
                        log.error("Failed to call Ollama API", e);
                        return Mono.error(new RuntimeException("LLM 호출 실패: " + e.getMessage()));
                    })
                    .block();

            return extractResponseText(response);

        } catch (Exception e) {
            log.error("Error sending prompt to Ollama", e);
            throw new RuntimeException("LLM 통신 오류", e);
        }
    }

    /**
     * Ollama 응답에서 실제 텍스트 추출
     */
    private String extractResponseText(String response) {
        try {
            JsonNode jsonNode = objectMapper.readTree(response);
            return jsonNode.get("response").asText();
        } catch (Exception e) {
            log.error("Failed to parse Ollama response", e);
            return response;
        }
    }

    /**
     * LLM 응답을 VocAnalysisResult로 파싱
     */
    private VocAnalysisResult parseAnalysisResponse(String llmResponse) {
        try {
            // JSON 응답에서 코드 블록 제거 (```json ... ``` 형식)
            String cleanJson = llmResponse
                    .replaceAll("```json\\s*", "")
                    .replaceAll("```\\s*", "")
                    .trim();

            JsonNode rootNode = objectMapper.readTree(cleanJson);

            // 카테고리 추천 파싱
            List<CategorySuggestion> categorySuggestions = new ArrayList<>();
            JsonNode categoriesNode = rootNode.get("categorySuggestions");
            if (categoriesNode != null && categoriesNode.isArray()) {
                for (JsonNode categoryNode : categoriesNode) {
                    categorySuggestions.add(new CategorySuggestion(
                            categoryNode.get("categoryName").asText(),
                            categoryNode.get("confidence").asDouble(),
                            categoryNode.get("reason").asText()
                    ));
                }
            }

            // 우선순위 추천 파싱
            JsonNode priorityNode = rootNode.get("prioritySuggestion");
            PrioritySuggestion prioritySuggestion = new PrioritySuggestion(
                    priorityNode.get("priority").asText(),
                    priorityNode.get("confidence").asDouble(),
                    priorityNode.get("reason").asText()
            );

            // 키워드 파싱
            List<String> keywords = new ArrayList<>();
            JsonNode keywordsNode = rootNode.get("keywords");
            if (keywordsNode != null && keywordsNode.isArray()) {
                for (JsonNode keyword : keywordsNode) {
                    keywords.add(keyword.asText());
                }
            }

            // 감정 분석
            String sentiment = rootNode.get("sentiment").asText();

            // 유사 VOC (현재는 빈 리스트)
            List<SimilarVoc> similarVocs = new ArrayList<>();

            return new VocAnalysisResult(
                    categorySuggestions,
                    prioritySuggestion,
                    keywords,
                    sentiment,
                    similarVocs
            );

        } catch (Exception e) {
            log.error("Failed to parse LLM analysis response: {}", llmResponse, e);
            throw new RuntimeException("LLM 응답 파싱 실패", e);
        }
    }
}
