package com.geonho.vocautobot.adapter.out.persistence.vector;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Vector Embedding Entity
 * pgvector를 사용한 임베딩 벡터 저장
 */
@Entity
@Table(name = "vector_embeddings", indexes = {
    @Index(name = "idx_vector_embeddings_voc_id", columnList = "voc_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class VectorEmbeddingEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "voc_id", nullable = false, unique = true)
    private Long vocId;

    /**
     * 임베딩 벡터 (1024 차원 - Ollama bge-m3 모델)
     * pgvector의 vector 타입 사용
     *
     * pgvector는 PostgreSQL extension으로, SQL에서는 vector(1024) 타입으로 정의됨
     * JPA에서는 문자열 또는 실수 배열로 매핑하여 사용
     */
    @Column(name = "embedding", columnDefinition = "vector(1024)", nullable = false)
    @org.hibernate.annotations.ColumnTransformer(write = "CAST(? AS vector)")
    private String embedding;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * VectorEmbeddingEntity 생성자
     *
     * @param vocId VOC ID
     * @param embedding 임베딩 벡터 (배열을 문자열로 변환한 형태: "[0.1, 0.2, ...]")
     */
    public VectorEmbeddingEntity(Long vocId, String embedding) {
        validateVocId(vocId);
        validateEmbedding(embedding);

        this.vocId = vocId;
        this.embedding = embedding;
    }

    /**
     * 임베딩 벡터 업데이트
     *
     * @param embedding 새로운 임베딩 벡터
     */
    public void updateEmbedding(String embedding) {
        validateEmbedding(embedding);
        this.embedding = embedding;
    }

    private void validateVocId(Long vocId) {
        if (vocId == null || vocId <= 0) {
            throw new IllegalArgumentException("VOC ID는 양수여야 합니다");
        }
    }

    private void validateEmbedding(String embedding) {
        if (embedding == null || embedding.isEmpty()) {
            throw new IllegalArgumentException("임베딩 벡터는 비어있을 수 없습니다");
        }
    }

    /**
     * float 배열을 pgvector 형식 문자열로 변환
     *
     * @param vector float 배열
     * @return pgvector 형식 문자열 "[0.1, 0.2, ...]"
     */
    public static String vectorToString(float[] vector) {
        if (vector == null || vector.length == 0) {
            throw new IllegalArgumentException("벡터가 비어있습니다");
        }

        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(",");
            }
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    /**
     * pgvector 형식 문자열을 float 배열로 변환
     *
     * @param vectorString pgvector 형식 문자열
     * @return float 배열
     */
    public static float[] stringToVector(String vectorString) {
        if (vectorString == null || vectorString.isEmpty()) {
            throw new IllegalArgumentException("벡터 문자열이 비어있습니다");
        }

        String cleaned = vectorString.trim()
            .replaceAll("^\\[", "")
            .replaceAll("\\]$", "");

        String[] parts = cleaned.split(",");
        float[] vector = new float[parts.length];

        for (int i = 0; i < parts.length; i++) {
            vector[i] = Float.parseFloat(parts[i].trim());
        }

        return vector;
    }
}
