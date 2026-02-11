package com.geonho.vocautobot.application.voc.port.out;

/**
 * VOC 감성 분석 결과 업데이트 포트
 */
public interface UpdateVocSentimentPort {

    void updateSentiment(Long vocId, String sentiment, Double sentimentConfidence);
}
