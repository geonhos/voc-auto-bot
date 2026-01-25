-- VOC Auto Bot - Update Vector Embeddings for Ollama
-- Version: 4.0
-- Date: 2026-01-25
-- Description: Rename voc_embedding to vector_embeddings and update dimension to 768 for Ollama nomic-embed-text

-- ===========================================
-- RENAME TABLE
-- ===========================================
ALTER TABLE voc_embedding RENAME TO vector_embeddings;

-- ===========================================
-- DROP EXISTING CONSTRAINTS AND INDEXES
-- ===========================================
-- Drop the existing HNSW index
DROP INDEX IF EXISTS idx_voc_embedding_vector;

-- ===========================================
-- UPDATE COLUMN STRUCTURE
-- ===========================================
-- Temporarily remove the vector column
ALTER TABLE vector_embeddings DROP COLUMN IF EXISTS embedding;

-- Add new vector column with 768 dimensions (Ollama nomic-embed-text)
ALTER TABLE vector_embeddings ADD COLUMN embedding vector(768);

-- Update model name default
ALTER TABLE vector_embeddings ALTER COLUMN model_name SET DEFAULT 'nomic-embed-text';

-- ===========================================
-- RECREATE INDEXES
-- ===========================================
-- Create HNSW index for fast cosine similarity search
CREATE INDEX idx_vector_embeddings_vector ON vector_embeddings USING hnsw (embedding vector_cosine_ops);

-- Create index on voc_id for faster lookups
CREATE INDEX idx_vector_embeddings_voc_id ON vector_embeddings (voc_id);

-- ===========================================
-- DROP OLD FUNCTION
-- ===========================================
DROP FUNCTION IF EXISTS find_similar_vocs(BIGINT, FLOAT, INT);

-- ===========================================
-- CREATE NEW SIMILARITY SEARCH FUNCTION
-- ===========================================
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

-- ===========================================
-- CREATE SIMILARITY SEARCH BY EMBEDDING VECTOR
-- ===========================================
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

-- ===========================================
-- COMMENTS
-- ===========================================
COMMENT ON TABLE vector_embeddings IS 'Stores vector embeddings for VOCs using Ollama nomic-embed-text model (768 dimensions)';
COMMENT ON COLUMN vector_embeddings.embedding IS 'Vector embedding with 768 dimensions for semantic similarity search';
COMMENT ON COLUMN vector_embeddings.model_name IS 'Embedding model name (default: nomic-embed-text)';
COMMENT ON INDEX idx_vector_embeddings_vector IS 'HNSW index for fast cosine similarity search on embeddings';
