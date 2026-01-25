package com.geonho.vocautobot.application.analysis.port.out;

import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult;

/**
 * LLM 호출을 위한 Output Port
 * Hexagonal Architecture의 외부 의존성을 추상화
 */
public interface LlmPort {

    /**
     * VOC 텍스트를 분석하여 카테고리, 우선순위 등을 추천
     *
     * @param vocContent VOC 내용
     * @param vocTitle VOC 제목
     * @return 분석 결과 (카테고리 추천, 우선순위, 키워드 등)
     */
    VocAnalysisResult analyzeVoc(String vocContent, String vocTitle);

    /**
     * 프롬프트를 전송하고 LLM 응답을 받음
     *
     * @param prompt 전송할 프롬프트
     * @return LLM 응답 텍스트
     */
    String sendPrompt(String prompt);
}
