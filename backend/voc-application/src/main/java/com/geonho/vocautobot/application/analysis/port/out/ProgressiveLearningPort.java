package com.geonho.vocautobot.application.analysis.port.out;

import com.geonho.vocautobot.application.analysis.dto.VocLogAnalysis;

/**
 * 점진적 학습을 위한 포트 인터페이스
 *
 * VOC가 완료(해결)되었을 때 해당 VOC의 분석 결과를 벡터 DB에 피드백하여
 * 향후 유사한 VOC 분석 시 더 정확한 결과를 제공할 수 있도록 합니다.
 */
public interface ProgressiveLearningPort {

    /**
     * 완료된 VOC로부터 학습
     *
     * VOC가 해결되었을 때 호출되어 해당 VOC의 제목, 내용, 해결 방법을
     * 벡터 DB에 저장하여 향후 유사한 VOC 분석에 활용합니다.
     *
     * @param vocId VOC 식별자
     * @param title VOC 제목
     * @param content VOC 내용
     * @param resolution 해결 방법/내용
     * @param analysisResult 원본 AI 분석 결과 (있는 경우)
     * @return 학습 성공 여부
     */
    boolean learnFromResolvedVoc(
        String vocId,
        String title,
        String content,
        String resolution,
        VocLogAnalysis analysisResult
    );

    /**
     * 학습 상태 확인
     *
     * 현재 점진적 학습 서비스의 상태를 확인합니다.
     *
     * @return 학습 서비스 사용 가능 여부
     */
    boolean isAvailable();
}
