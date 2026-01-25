package com.geonho.vocautobot.application.analysis.port.out;

import java.util.List;

/**
 * Vector Search를 위한 Output Port
 * pgvector를 이용한 유사도 검색을 추상화
 */
public interface VectorSearchPort {

    /**
     * VOC의 임베딩 벡터를 생성하고 저장
     *
     * @param vocId VOC ID
     * @param text 임베딩할 텍스트 (제목 + 내용)
     * @return 저장된 임베딩 ID
     */
    Long saveEmbedding(Long vocId, String text);

    /**
     * 유사한 VOC를 벡터 유사도 기반으로 검색
     *
     * @param vocId 기준 VOC ID
     * @param limit 조회할 최대 개수
     * @param threshold 유사도 임계값 (0.0 ~ 1.0)
     * @return 유사한 VOC ID와 유사도 점수 리스트
     */
    List<SimilarVocResult> findSimilarVocs(Long vocId, int limit, double threshold);

    /**
     * 텍스트로부터 직접 유사 VOC 검색
     *
     * @param text 검색할 텍스트
     * @param limit 조회할 최대 개수
     * @param threshold 유사도 임계값
     * @return 유사한 VOC ID와 유사도 점수 리스트
     */
    List<SimilarVocResult> searchByText(String text, int limit, double threshold);

    /**
     * VOC의 임베딩 삭제
     *
     * @param vocId VOC ID
     */
    void deleteEmbedding(Long vocId);

    /**
     * 유사 VOC 검색 결과
     */
    record SimilarVocResult(
        Long vocId,
        double similarityScore
    ) {}
}
