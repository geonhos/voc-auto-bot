-- VOC Auto Bot - Migrate Embedding Dimension from 768 to 1024
-- Version: 12.0
-- Date: 2026-02-18
-- Description: bge-m3 모델 전환에 따른 임베딩 차원 변경 (768 -> 1024)
--              기존 임베딩 데이터 삭제 후 컬럼 타입 변경 및 HNSW 인덱스 재생성

-- Step 1: Drop existing HNSW index (dimension-dependent)
DROP INDEX IF EXISTS idx_vector_embeddings_vector;

-- Step 2: Truncate existing embeddings (dimension mismatch makes them unusable)
TRUNCATE vector_embeddings;

-- Step 3: Alter column type from vector(768) to vector(1024)
ALTER TABLE vector_embeddings
    ALTER COLUMN embedding TYPE vector(1024);

-- Step 4: Recreate HNSW index for cosine similarity search
CREATE INDEX idx_vector_embeddings_vector
    ON vector_embeddings USING hnsw (embedding vector_cosine_ops);

-- Step 5: Update find_similar_vocs_by_vector function parameter type
CREATE OR REPLACE FUNCTION find_similar_vocs_by_vector(
    target_embedding vector(1024),
    similarity_threshold FLOAT DEFAULT 0.7,
    max_results INT DEFAULT 10
)
RETURNS TABLE (
    voc_id BIGINT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ve.voc_id,
        1 - (target_embedding <=> ve.embedding) as similarity
    FROM vector_embeddings ve
    WHERE ve.embedding IS NOT NULL
      AND 1 - (target_embedding <=> ve.embedding) >= similarity_threshold
    ORDER BY target_embedding <=> ve.embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
