"""Embedding service for log vectorization and similarity search using PostgreSQL pgvector."""

import json
import logging
import os
from pathlib import Path
from typing import List, Optional, Tuple

from langchain_community.embeddings import OllamaEmbeddings
from psycopg_pool import ConnectionPool

from app.models.schemas import LogDocument

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for embedding logs and performing similarity search with pgvector."""

    def __init__(
        self,
        model_name: str = "nomic-embed-text",
        ollama_base_url: str = "http://localhost:11434",
        db_pool: Optional[ConnectionPool] = None,
    ):
        """Initialize embedding service.

        Args:
            model_name: Ollama embedding model name.
            ollama_base_url: Ollama server base URL.
            db_pool: psycopg ConnectionPool for PostgreSQL.
        """
        self.embeddings = OllamaEmbeddings(
            model=model_name, base_url=ollama_base_url
        )
        self.db_pool = db_pool
        self._initialized = False

    def initialize_vectorstore(self, logs: List[LogDocument]) -> None:
        """Initialize vector store with log documents (idempotent).

        Skips seeding if the table already contains data.
        Uses deterministic IDs to prevent duplicates.

        Args:
            logs: List of log documents to vectorize.
        """
        if self._initialized:
            return

        if self.db_pool is None:
            raise RuntimeError("Database pool not provided.")

        existing_count = self.get_collection_count()
        if existing_count > 0:
            logger.info(
                "Log collection already has %d documents, skipping seed",
                existing_count,
            )
            self._initialized = True
            return

        self._batch_insert_logs(logs)
        logger.info("Seeded %d log documents to collection", len(logs))
        self._initialized = True

    def add_logs(self, logs: List[LogDocument]) -> int:
        """Add log documents to the vector store (idempotent via deterministic IDs).

        Args:
            logs: List of log documents to add.

        Returns:
            Number of documents added.
        """
        if self.db_pool is None:
            raise RuntimeError("Database pool not provided.")

        return self._batch_insert_logs(logs)

    def _batch_insert_logs(self, logs: List[LogDocument], batch_size: int = 50) -> int:
        """Batch insert logs with embeddings into PostgreSQL.

        Args:
            logs: List of log documents.
            batch_size: Number of documents per batch.

        Returns:
            Number of documents inserted.
        """
        if not logs:
            return 0

        total_inserted = 0
        for i in range(0, len(logs), batch_size):
            batch = logs[i : i + batch_size]
            texts = [log.to_text() for log in batch]
            embedding_vectors = self.embeddings.embed_documents(texts)

            with self.db_pool.connection() as conn:
                with conn.cursor() as cur:
                    for log, text, embedding in zip(batch, texts, embedding_vectors):
                        log_id = f"log-{log.id}"
                        metadata = log.to_metadata()
                        cur.execute(
                            """
                            INSERT INTO log_embeddings (log_id, content, metadata, embedding)
                            VALUES (%s, %s, %s::jsonb, %s::vector)
                            ON CONFLICT (log_id) DO NOTHING
                            """,
                            (log_id, text, json.dumps(metadata), str(embedding)),
                        )
                        total_inserted += cur.rowcount
                conn.commit()

            logger.debug("Inserted batch %d-%d", i, i + len(batch))

        logger.info("Added %d log documents", total_inserted)
        return total_inserted

    def load_mock_logs(self, mock_logs_path: str = None) -> List[LogDocument]:
        """Load mock log data from JSON file.

        Args:
            mock_logs_path: Path to mock logs JSON file.

        Returns:
            List of LogDocument objects.
        """
        if mock_logs_path is None:
            current_dir = Path(__file__).parent.parent
            mock_logs_path = current_dir / "data" / "mock_logs.json"

        with open(mock_logs_path, "r", encoding="utf-8") as f:
            logs_data = json.load(f)

        return [LogDocument(**log) for log in logs_data]

    def search_similar_logs(
        self, query: str, k: int = 5
    ) -> List[Tuple[LogDocument, float]]:
        """Search for logs similar to query using cosine similarity.

        Args:
            query: Search query (VOC content).
            k: Number of results to return.

        Returns:
            List of tuples (log_document, relevance_score) where score is in [0, 1].
        """
        if not self._initialized or self.db_pool is None:
            raise RuntimeError("Vector store not initialized. Call initialize_vectorstore first.")

        collection_count = self.get_collection_count()
        if collection_count == 0:
            return []

        query_embedding = self.embeddings.embed_query(query)
        effective_k = min(k, collection_count)

        with self.db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT log_id, content, metadata, embedding <=> %s::vector AS distance
                    FROM log_embeddings
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (str(query_embedding), str(query_embedding), effective_k),
                )
                rows = cur.fetchall()

        log_results = []
        for log_id, content, metadata, distance in rows:
            similarity = max(0.0, min(1.0, 1.0 - distance))
            log_doc = LogDocument(
                id=metadata["id"],
                timestamp=metadata["timestamp"],
                logLevel=metadata["logLevel"],
                serviceName=metadata["serviceName"],
                message=metadata["message"],
                category=metadata["category"],
                severity=metadata["severity"],
            )
            log_results.append((log_doc, similarity))

        return log_results

    def is_initialized(self) -> bool:
        """Check if vector store is initialized."""
        return self._initialized

    def get_collection_count(self) -> int:
        """Get the number of documents in the collection."""
        if self.db_pool is None:
            return 0

        with self.db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM log_embeddings")
                count = cur.fetchone()[0]
        return count

    def reset_vectorstore(self) -> None:
        """Reset vector store completely (deletes all data)."""
        if self.db_pool is None:
            raise RuntimeError("Database pool not provided.")

        with self.db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("TRUNCATE log_embeddings RESTART IDENTITY")
            conn.commit()

        logger.info("Truncated log_embeddings table")
        self._initialized = False
