package com.geonho.vocautobot.adapter.out.ai;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * LLM 프롬프트 템플릿 관리
 */
@Component
public class PromptTemplate {

    /**
     * VOC 분석을 위한 프롬프트 생성
     *
     * @param vocTitle VOC 제목
     * @param vocContent VOC 내용
     * @return 완성된 프롬프트
     */
    public String createVocAnalysisPrompt(String vocTitle, String vocContent) {
        return """
                당신은 고객 피드백(VOC) 분석 전문가입니다.
                다음 VOC를 분석하여 JSON 형식으로 응답해주세요.

                VOC 제목: %s
                VOC 내용: %s

                다음 형식으로 응답해주세요:
                {
                  "categorySuggestions": [
                    {
                      "categoryName": "추천 카테고리명",
                      "confidence": 0.0~1.0,
                      "reason": "추천 이유"
                    }
                  ],
                  "prioritySuggestion": {
                    "priority": "HIGH|MEDIUM|LOW",
                    "confidence": 0.0~1.0,
                    "reason": "우선순위 판단 이유"
                  },
                  "keywords": ["키워드1", "키워드2", "키워드3"],
                  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
                  "similarVocs": []
                }

                분석 기준:
                1. 카테고리: 제품 문의, 기능 개선, 버그 리포트, 서비스 문의, 기타 중 선택
                2. 우선순위: 긴급성, 영향 범위, 고객 감정 고려
                3. 키워드: VOC의 핵심 키워드 3-5개 추출
                4. 감정: 고객의 전반적인 감정 상태

                JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요.
                """.formatted(vocTitle, vocContent);
    }

    /**
     * 카테고리 추천을 위한 프롬프트 생성
     *
     * @param title VOC 제목
     * @param content VOC 내용
     * @param categoryNamesWithCodes 카테고리명(코드) 목록
     * @return 완성된 프롬프트
     */
    public String createCategorySuggestionPrompt(String title, String content, List<String> categoryNamesWithCodes) {
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

    /**
     * 일반 프롬프트 생성
     *
     * @param userPrompt 사용자 프롬프트
     * @return 완성된 프롬프트
     */
    public String createSimplePrompt(String userPrompt) {
        return userPrompt;
    }
}
