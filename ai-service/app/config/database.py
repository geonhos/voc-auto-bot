import logging
import os

import psycopg
from psycopg_pool import ConnectionPool
from pgvector.psycopg import register_vector

logger = logging.getLogger(__name__)

_pool: ConnectionPool | None = None


def get_pool() -> ConnectionPool:
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Call init_pool() first.")
    return _pool


def init_pool(database_url: str | None = None, min_size: int = 2, max_size: int = 10) -> ConnectionPool:
    global _pool
    if _pool is not None:
        return _pool

    url = database_url or os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("DATABASE_URL environment variable is required")
    logger.info(f"Initializing database connection pool: {url.split('@')[-1]}")

    _pool = ConnectionPool(
        conninfo=url,
        min_size=min_size,
        max_size=max_size,
        configure=_configure_connection,
    )
    return _pool


def _configure_connection(conn: psycopg.Connection) -> None:
    register_vector(conn)


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None
        logger.info("Database connection pool closed.")


def ensure_log_embeddings_table() -> None:
    pool = get_pool()
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
            cur.execute("""
                CREATE TABLE IF NOT EXISTS log_embeddings (
                    id SERIAL PRIMARY KEY,
                    log_id VARCHAR(255) NOT NULL UNIQUE,
                    content TEXT NOT NULL,
                    metadata JSONB NOT NULL DEFAULT '{}',
                    embedding vector(768) NOT NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_log_embeddings_log_id
                ON log_embeddings(log_id)
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_log_embeddings_vector
                ON log_embeddings USING hnsw (embedding vector_cosine_ops)
            """)
        conn.commit()
    logger.info("log_embeddings table ensured.")
