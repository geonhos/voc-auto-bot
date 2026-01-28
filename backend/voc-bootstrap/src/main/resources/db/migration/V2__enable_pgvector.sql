-- VOC Auto Bot - Enable pgvector Extension and Create Vector Table
-- Version: 2.0
-- Date: 2026-01-25

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ===========================================
-- VECTOR EMBEDDINGS TABLE
-- 768 dimensions for Ollama nomic-embed-text model
-- ===========================================
CREATE TABLE vector_embeddings (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL UNIQUE REFERENCES vocs(id) ON DELETE CASCADE,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vector_embeddings_voc_id ON vector_embeddings(voc_id);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_vector_embeddings_vector ON vector_embeddings USING hnsw (embedding vector_cosine_ops);

-- Function to find similar VOCs by VOC ID
CREATE OR REPLACE FUNCTION find_similar_vocs_by_id(
    target_voc_id BIGINT,
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
        ve2.voc_id,
        1 - (ve1.embedding <=> ve2.embedding) as similarity
    FROM vector_embeddings ve1
    JOIN vector_embeddings ve2 ON ve1.voc_id != ve2.voc_id
    WHERE ve1.voc_id = target_voc_id
      AND ve1.embedding IS NOT NULL
      AND ve2.embedding IS NOT NULL
      AND 1 - (ve1.embedding <=> ve2.embedding) >= similarity_threshold
    ORDER BY ve1.embedding <=> ve2.embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar VOCs by embedding vector
CREATE OR REPLACE FUNCTION find_similar_vocs_by_vector(
    target_embedding vector(768),
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
