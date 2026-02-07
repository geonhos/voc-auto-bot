package com.geonho.vocautobot.application.analysis.port.out;

import com.geonho.vocautobot.application.analysis.dto.VocAnalysisDto;

import java.util.Optional;

/**
 * VOC 분석 결과 영속성 포트
 */
public interface VocAnalysisPersistencePort {

    /**
     * VOC 분석 결과 생성 (PENDING 상태)
     */
    VocAnalysisDto createPendingAnalysis(Long vocId);

    /**
     * VOC ID로 분석 결과 조회
     */
    Optional<VocAnalysisDto> findByVocId(Long vocId);

    /**
     * 분석 시작 상태로 변경
     */
    void startAnalysis(Long vocId);

    /**
     * 분석 완료 저장
     */
    void completeAnalysis(Long vocId, String summary, Double confidence, String keywords,
                          String possibleCauses, String relatedLogs, String recommendation);

    /**
     * 분석 실패 저장
     */
    void failAnalysis(Long vocId, String errorMessage);

    /**
     * 분석 결과 초기화 (재분석용)
     */
    void resetAnalysis(Long vocId);
}
