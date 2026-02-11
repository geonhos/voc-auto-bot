package com.geonho.vocautobot.application.category.usecase;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.geonho.vocautobot.application.analysis.port.out.LlmPort;
import com.geonho.vocautobot.application.category.port.in.SuggestCategoryUseCase;
import com.geonho.vocautobot.application.category.port.in.dto.CategorySuggestionResult;
import com.geonho.vocautobot.application.category.port.out.LoadCategoryPort;
import com.geonho.vocautobot.application.common.UseCase;
import com.geonho.vocautobot.domain.category.Category;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@UseCase
@Transactional(readOnly = true)
public class SuggestCategoryService implements SuggestCategoryUseCase {

    private static final Logger log = LoggerFactory.getLogger(SuggestCategoryService.class);
    private static final int MAX_SUGGESTIONS = 3;

    private final LlmPort llmPort;
    private final LoadCategoryPort loadCategoryPort;
    private final ObjectMapper objectMapper;

    public SuggestCategoryService(LlmPort llmPort, LoadCategoryPort loadCategoryPort, ObjectMapper objectMapper) {
        this.llmPort = llmPort;
        this.loadCategoryPort = loadCategoryPort;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<CategorySuggestionResult> suggestCategories(String title, String content) {
        try {
            List<Category> activeCategories = loadCategoryPort.loadActiveCategories();
            if (activeCategories.isEmpty()) {
                return List.of();
            }

            List<String> categoryNamesWithCodes = activeCategories.stream()
                    .map(c -> c.getName() + " (" + c.getCode() + ")")
                    .toList();

            String prompt = createCategorySuggestionPrompt(title, content, categoryNamesWithCodes);
            String llmResponse = llmPort.sendPrompt(prompt);

            return parseSuggestions(llmResponse, activeCategories);
        } catch (Exception e) {
            log.error("카테고리 추천 중 오류 발생: {}", e.getMessage(), e);
            return List.of();
        }
    }

    private String createCategorySuggestionPrompt(String title, String content, List<String> categoryNamesWithCodes) {
        String categoryList = String.join("\n", categoryNamesWithCodes.stream()
                .map(c -> "- " + c)
                .toList());

        return """
                당신은 고객 피드백(VOC) 분류 전문가입니다.
                다음 VOC를 분석하여 가장 적합한 카테고리를 추천해주세요.

                VOC 제목: %s
                VOC 내용: %s

                사용 가능한 카테고리 목록:
                %s

                위 카테고리 목록에서만 선택하여 최대 3개의 카테고리를 추천해주세요.
                반드시 다음 JSON 형식으로만 응답하세요:
                {
                  "suggestions": [
                    {
                      "categoryName": "카테고리명 (목록에 있는 정확한 이름)",
                      "confidence": 0.0~1.0,
                      "reason": "추천 이유"
                    }
                  ]
                }

                주의사항:
                1. categoryName은 반드시 위 목록에 있는 카테고리명과 정확히 일치해야 합니다.
                2. confidence는 0.0~1.0 사이의 값으로 추천 확신도를 나타냅니다.
                3. 최대 3개까지만 추천하세요.
                4. confidence 기준 내림차순으로 정렬하세요.
                5. JSON 형식으로만 응답하세요.
                """.formatted(title, content, categoryList);
    }

    private List<CategorySuggestionResult> parseSuggestions(String llmResponse, List<Category> activeCategories) {
        try {
            String cleanJson = extractJson(llmResponse);
            JsonNode rootNode = objectMapper.readTree(cleanJson);
            JsonNode suggestionsNode = rootNode.get("suggestions");

            if (suggestionsNode == null || !suggestionsNode.isArray()) {
                log.warn("LLM 응답에 suggestions 배열이 없습니다: {}", llmResponse);
                return List.of();
            }

            Map<String, Category> categoryByName = activeCategories.stream()
                    .collect(Collectors.toMap(Category::getName, c -> c, (a, b) -> a));

            List<CategorySuggestionResult> results = new ArrayList<>();
            for (JsonNode suggestion : suggestionsNode) {
                String categoryName = suggestion.get("categoryName").asText();
                Category matched = categoryByName.get(categoryName);

                if (matched == null) {
                    log.debug("LLM이 추천한 카테고리 '{}' 이(가) DB에 존재하지 않아 건너뜁니다", categoryName);
                    continue;
                }

                results.add(new CategorySuggestionResult(
                        matched.getId(),
                        matched.getName(),
                        matched.getCode(),
                        suggestion.get("confidence").asDouble(),
                        suggestion.get("reason").asText()
                ));

                if (results.size() >= MAX_SUGGESTIONS) {
                    break;
                }
            }

            results.sort(Comparator.comparingDouble(CategorySuggestionResult::confidence).reversed());
            return results;
        } catch (Exception e) {
            log.error("LLM 카테고리 추천 응답 파싱 실패: {}", llmResponse, e);
            return List.of();
        }
    }

    private String extractJson(String response) {
        if (response == null || response.isEmpty()) {
            return "{}";
        }
        int firstBrace = response.indexOf('{');
        int lastBrace = response.lastIndexOf('}');
        if (firstBrace == -1 || lastBrace == -1 || lastBrace <= firstBrace) {
            return response;
        }
        return response.substring(firstBrace, lastBrace + 1);
    }
}
