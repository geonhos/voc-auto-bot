-- VOC Auto Bot - Enable pgvector Extension
-- Version: 2.0
-- Date: 2026-01-25

-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ===========================================
-- VOC EMBEDDING TABLE
-- ===========================================
CREATE TABLE voc_embedding (
    id BIGSERIAL PRIMARY KEY,
    voc_id BIGINT NOT NULL UNIQUE REFERENCES voc(id) ON DELETE CASCADE,
    embedding vector(1536),  -- OpenAI ada-002 dimension
    model_name VARCHAR(50) NOT NULL DEFAULT 'text-embedding-ada-002',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create HNSW index for fast similarity search
CREATE INDEX idx_voc_embedding_vector ON voc_embedding USING hnsw (embedding vector_cosine_ops);

-- Function to find similar VOCs
CREATE OR REPLACE FUNCTION find_similar_vocs(
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
    FROM voc_embedding ve1
    JOIN voc_embedding ve2 ON ve1.voc_id != ve2.voc_id
    WHERE ve1.voc_id = target_voc_id
      AND 1 - (ve1.embedding <=> ve2.embedding) >= similarity_threshold
    ORDER BY ve1.embedding <=> ve2.embedding
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
