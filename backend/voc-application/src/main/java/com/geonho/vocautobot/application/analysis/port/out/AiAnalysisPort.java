package com.geonho.vocautobot.application.analysis.port.out;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;

/**
 * AI 분석 서비스 연동을 위한 포트 인터페이스
 * Python AI 서비스 또는 다른 AI 서비스 구현체를 주입받아 사용
 */
public interface AiAnalysisPort {

    /**
     * VOC를 AI 서비스로 분석
     *
     * @param vocTitle VOC 제목
     * @param vocContent VOC 내용
     * @return AI 분석 결과
     */
    VocLogAnalysis analyzeVoc(String vocTitle, String vocContent);
}
