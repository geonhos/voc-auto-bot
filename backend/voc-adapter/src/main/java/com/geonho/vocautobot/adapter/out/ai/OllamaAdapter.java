package com.geonho.vocautobot.adapter.out.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.adapter.out.ai.exception.LlmIntegrationException;
import com.geonho.vocautobot.adapter.out.ai.exception.LlmIntegrationException.ErrorType;
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
                        return Mono.error(new LlmIntegrationException(ErrorType.NETWORK_ERROR, e.getMessage(), e));
                    })
                    .block();

            return extractResponseText(response);

        } catch (LlmIntegrationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error sending prompt to Ollama", e);
            throw new LlmIntegrationException(ErrorType.NETWORK_ERROR, "LLM 통신 오류", e);
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
            // JSON 응답에서 JSON 부분만 추출 (첫 번째 { 와 마지막 } 사이)
            String cleanJson = extractJsonFromResponse(llmResponse);

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
            throw new LlmIntegrationException(ErrorType.PARSING_ERROR, "LLM 응답 파싱 실패", e);
        }
    }

    /**
     * LLM 응답에서 JSON 부분만 추출
     * 첫 번째 '{' 와 마지막 '}' 사이의 내용을 반환
     */
    private String extractJsonFromResponse(String response) {
        if (response == null || response.isEmpty()) {
            throw new LlmIntegrationException(ErrorType.INVALID_RESPONSE, "빈 응답");
        }

        int firstBrace = response.indexOf('{');
        int lastBrace = response.lastIndexOf('}');

        if (firstBrace == -1 || lastBrace == -1 || firstBrace > lastBrace) {
            log.warn("No valid JSON object found in response: {}", response);
            throw new LlmIntegrationException(ErrorType.INVALID_RESPONSE, "유효한 JSON을 찾을 수 없음");
        }

        return response.substring(firstBrace, lastBrace + 1);
    }
}
