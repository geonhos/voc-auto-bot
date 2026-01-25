package com.geonho.vocautobot.application.analysis.port.in;

import com.geonho.vocautobot.application.analysis.port.in.dto.AnalyzeVocCommand;
import com.geonho.vocautobot.application.analysis.port.in.dto.VocAnalysisResult;

/**
 * VOC 분석 Use Case
 * LLM을 활용하여 VOC의 카테고리, 우선순위, 감정 등을 분석
 */
public interface AnalyzeVocUseCase {

    /**
     * VOC를 분석하여 카테고리 추천, 우선순위 추천, 키워드 추출 등을 수행
     *
     * @param command VOC 분석 요청 정보
     * @return VOC 분석 결과
     */
    VocAnalysisResult analyzeVoc(AnalyzeVocCommand command);
}
