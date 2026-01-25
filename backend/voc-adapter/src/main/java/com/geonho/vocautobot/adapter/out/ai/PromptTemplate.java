package com.geonho.vocautobot.adapter.out.ai;

import org.springframework.stereotype.Component;

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
     * 일반 프롬프트 생성
     *
     * @param userPrompt 사용자 프롬프트
     * @return 완성된 프롬프트
     */
    public String createSimplePrompt(String userPrompt) {
        return userPrompt;
    }
}
