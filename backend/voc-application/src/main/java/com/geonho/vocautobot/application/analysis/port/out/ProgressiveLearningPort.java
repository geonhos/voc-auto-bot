package com.geonho.vocautobot.application.analysis.port.out;

/**
 * 점진적 학습을 위한 출력 포트 인터페이스.
 *
 * VOC가 완료(해결)되면 해당 VOC의 분석 결과를 벡터 데이터베이스에 추가하여
 * 향후 유사한 VOC 분석 시 더 정확한 결과를 제공할 수 있도록 합니다.
 *
 * <p>점진적 학습 프로세스:
 * <ol>
 *   <li>VOC가 해결됨 (RESOLVED 상태로 변경)</li>
 *   <li>해결 정보와 함께 이 포트를 통해 학습 요청</li>
 *   <li>AI 서비스가 해당 VOC를 벡터 DB에 추가</li>
 *   <li>향후 유사 VOC 분석 시 참조 데이터로 활용</li>
 * </ol>
 *
 * <p>참고: 학습 실패가 VOC 처리 흐름을 차단해서는 안 됩니다.
 * 비동기 처리를 권장합니다.
 */
public interface ProgressiveLearningPort {

    /**
     * 해결된 VOC로부터 학습합니다.
     *
     * @param vocId      VOC 식별자
     * @param title      VOC 제목
     * @param content    VOC 내용
     * @param resolution 적용된 해결 방법/조치
     * @param category   VOC 카테고리
     * @return 학습 성공 여부
     */
    boolean learnFromResolvedVoc(
        Long vocId,
        String title,
        String content,
        String resolution,
        String category
    );

    /**
     * 해결된 VOC로부터 비동기로 학습합니다.
     *
     * 학습 실패가 메인 비즈니스 로직에 영향을 주지 않도록
     * 비동기로 처리하는 것을 권장합니다.
     *
     * @param vocId      VOC 식별자
     * @param title      VOC 제목
     * @param content    VOC 내용
     * @param resolution 적용된 해결 방법/조치
     * @param category   VOC 카테고리
     */
    default void learnFromResolvedVocAsync(
        Long vocId,
        String title,
        String content,
        String resolution,
        String category
    ) {
        // 기본 구현: 동기 호출 (어댑터에서 비동기 구현 가능)
        learnFromResolvedVoc(vocId, title, content, resolution, category);
    }
}
