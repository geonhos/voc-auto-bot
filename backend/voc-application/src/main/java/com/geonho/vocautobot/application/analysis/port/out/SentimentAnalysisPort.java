package com.geonho.vocautobot.application.analysis.port.out;

/**
 * 감성 분석 AI 서비스 호출 포트
 */
public interface SentimentAnalysisPort {

    SentimentResult analyze(String text);

    record SentimentResult(
            String sentiment,
            double confidence,
            java.util.Map<String, Double> emotions
    ) {}
}
