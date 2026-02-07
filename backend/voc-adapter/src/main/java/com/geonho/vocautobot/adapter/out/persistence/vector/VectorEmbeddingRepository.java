package com.geonho.vocautobot.adapter.out.persistence.vector;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

/**
 * Vector Embedding Repository
 * pgvector를 활용한 유사도 검색 쿼리 제공
 */
public interface VectorEmbeddingRepository extends JpaRepository<VectorEmbeddingEntity, Long> {

    /**
     * VOC ID로 임베딩 조회
     *
     * @param vocId VOC ID
     * @return VectorEmbeddingEntity
     */
    Optional<VectorEmbeddingEntity> findByVocId(Long vocId);

    /**
     * VOC ID로 임베딩 삭제
     *
     * @param vocId VOC ID
     */
    void deleteByVocId(Long vocId);

    /**
     * 코사인 유사도 기반 유사 벡터 검색
     * pgvector의 <=> 연산자 사용 (코사인 거리)
     * 거리가 작을수록 유사함 (0에 가까울수록 유사)
     *
     * @param vocId 기준 VOC ID
     * @param limit 조회 개수
     * @return 유사한 VOC와 유사도 점수 리스트
     */
    @Query(value = """
        SELECT ve.voc_id as vocId,
               1 - (ve.embedding <=> base.embedding) as similarity
        FROM vector_embeddings ve
        CROSS JOIN (
            SELECT embedding
            FROM vector_embeddings
            WHERE voc_id = :vocId
        ) base
        WHERE ve.voc_id != :vocId
        ORDER BY ve.embedding <=> base.embedding
        LIMIT :limit
        """, nativeQuery = true)
    List<VectorSimilarityProjection> findSimilarByVocId(
        @Param("vocId") Long vocId,
        @Param("limit") int limit
    );

    /**
     * 코사인 유사도 기반 유사 벡터 검색 (임계값 포함)
     *
     * @param vocId 기준 VOC ID
     * @param threshold 유사도 임계값 (0.0 ~ 1.0)
     * @param limit 조회 개수
     * @return 유사한 VOC와 유사도 점수 리스트
     */
    @Query(value = """
        SELECT ve.voc_id as vocId,
               1 - (ve.embedding <=> base.embedding) as similarity
        FROM vector_embeddings ve
        CROSS JOIN (
            SELECT embedding
            FROM vector_embeddings
            WHERE voc_id = :vocId
        ) base
        WHERE ve.voc_id != :vocId
          AND 1 - (ve.embedding <=> base.embedding) >= :threshold
        ORDER BY ve.embedding <=> base.embedding
        LIMIT :limit
        """, nativeQuery = true)
    List<VectorSimilarityProjection> findSimilarByVocIdWithThreshold(
        @Param("vocId") Long vocId,
        @Param("threshold") double threshold,
        @Param("limit") int limit
    );

    /**
     * 텍스트 임베딩으로 직접 유사도 검색
     *
     * @param embedding 검색할 임베딩 벡터 (pgvector 형식 문자열)
     * @param threshold 유사도 임계값
     * @param limit 조회 개수
     * @return 유사한 VOC와 유사도 점수 리스트
     */
    @Query(value = """
        SELECT ve.voc_id as vocId,
               1 - (ve.embedding <=> CAST(:embedding AS vector)) as similarity
        FROM vector_embeddings ve
        WHERE 1 - (ve.embedding <=> CAST(:embedding AS vector)) >= :threshold
        ORDER BY ve.embedding <=> CAST(:embedding AS vector)
        LIMIT :limit
        """, nativeQuery = true)
    List<VectorSimilarityProjection> findSimilarByEmbedding(
        @Param("embedding") String embedding,
        @Param("threshold") double threshold,
        @Param("limit") int limit
    );

    /**
     * 임베딩이 존재하는 VOC ID 목록 조회 (배치)
     *
     * @param vocIds 확인할 VOC ID 목록
     * @return 임베딩이 존재하는 VOC ID 리스트
     */
    @Query("SELECT ve.vocId FROM VectorEmbeddingEntity ve WHERE ve.vocId IN :vocIds")
    List<Long> findVocIdsByVocIdIn(@Param("vocIds") java.util.Collection<Long> vocIds);

    /**
     * 유사도 검색 결과 Projection
     */
    interface VectorSimilarityProjection {
        Long getVocId();
        Double getSimilarity();
    }
}
