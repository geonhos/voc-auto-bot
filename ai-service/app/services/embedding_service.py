"""Embedding service for log vectorization and similarity search."""

import json
import logging
import os
from pathlib import Path
from typing import List, Optional, Tuple

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from app.models.schemas import LogDocument

logger = logging.getLogger(__name__)

COSINE_METADATA = {"hnsw:space": "cosine"}
LOG_COLLECTION_NAME = "log_embeddings"


class EmbeddingService:
    """Service for embedding logs and performing similarity search."""

    def __init__(
        self,
        model_name: str = "nomic-embed-text",
        ollama_base_url: str = "http://localhost:11434",
        persist_directory: str = "./chroma_db",
    ):
        """Initialize embedding service.

        Args:
            model_name: Ollama embedding model name.
            ollama_base_url: Ollama server base URL.
            persist_directory: Directory to persist ChromaDB.
        """
        self.embeddings = OllamaEmbeddings(
            model=model_name, base_url=ollama_base_url
        )
        self.persist_directory = persist_directory
        self.vectorstore: Optional[Chroma] = None
        self._initialized = False

    def initialize_vectorstore(self, logs: List[LogDocument]) -> None:
        """Initialize vector store with log documents (idempotent).

        Skips seeding if the collection already contains data.
        Uses deterministic IDs to prevent duplicates.

        Args:
            logs: List of log documents to vectorize.
        """
        if self._initialized:
            return

        # Connect to existing collection or create new one with cosine metric
        self.vectorstore = Chroma(
            collection_name=LOG_COLLECTION_NAME,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory,
            collection_metadata=COSINE_METADATA,
        )

        existing_count = self.vectorstore._collection.count()
        if existing_count > 0:
            logger.info(
                "Log collection already has %d documents, skipping seed",
                existing_count,
            )
            self._initialized = True
            return

        # Seed: convert logs and add with deterministic IDs
        documents = []
        ids = []
        for log in logs:
            documents.append(
                Document(
                    page_content=log.to_text(),
                    metadata=log.to_metadata(),
                )
            )
            ids.append(f"log-{log.id}")

        self.vectorstore.add_documents(documents, ids=ids)
        logger.info("Seeded %d log documents to collection", len(documents))
        self._initialized = True

    def add_logs(self, logs: List[LogDocument]) -> int:
        """Add log documents to the vector store (idempotent via deterministic IDs).

        Args:
            logs: List of log documents to add.

        Returns:
            Number of documents added.
        """
        if self.vectorstore is None:
            raise RuntimeError("Vector store not initialized.")

        documents = []
        ids = []
        for log in logs:
            doc_id = f"log-{log.id}"
            documents.append(
                Document(
                    page_content=log.to_text(),
                    metadata=log.to_metadata(),
                )
            )
            ids.append(doc_id)

        self.vectorstore.add_documents(documents, ids=ids)
        logger.info("Added %d log documents", len(documents))
        return len(documents)

    def load_mock_logs(self, mock_logs_path: str = None) -> List[LogDocument]:
        """Load mock log data from JSON file.

        Args:
            mock_logs_path: Path to mock logs JSON file.

        Returns:
            List of LogDocument objects.
        """
        if mock_logs_path is None:
            # Default path relative to this file
            current_dir = Path(__file__).parent.parent
            mock_logs_path = current_dir / "data" / "mock_logs.json"

        with open(mock_logs_path, "r", encoding="utf-8") as f:
            logs_data = json.load(f)

        return [LogDocument(**log) for log in logs_data]

    def search_similar_logs(
        self, query: str, k: int = 5
    ) -> List[Tuple[LogDocument, float]]:
        """Search for logs similar to query.

        With cosine distance, relevance scores are in [0, 1] range.

        Args:
            query: Search query (VOC content).
            k: Number of results to return.

        Returns:
            List of tuples (log_document, relevance_score).
        """
        if not self._initialized or self.vectorstore is None:
            raise RuntimeError("Vector store not initialized. Call initialize_vectorstore first.")

        collection_count = self.vectorstore._collection.count()
        if collection_count == 0:
            return []

        results = self.vectorstore.similarity_search_with_relevance_scores(
            query=query, k=min(k, collection_count)
        )

        log_results = []
        for doc, score in results:
            # Cosine relevance scores should be in [0, 1]
            normalized_score = max(0.0, min(1.0, score))
            log_doc = LogDocument(
                id=doc.metadata["id"],
                timestamp=doc.metadata["timestamp"],
                logLevel=doc.metadata["logLevel"],
                serviceName=doc.metadata["serviceName"],
                message=doc.metadata["message"],
                category=doc.metadata["category"],
                severity=doc.metadata["severity"],
            )
            log_results.append((log_doc, normalized_score))

        return log_results

    def is_initialized(self) -> bool:
        """Check if vector store is initialized."""
        return self._initialized

    def get_collection_count(self) -> int:
        """Get the number of documents in the collection."""
        if self.vectorstore is None:
            return 0
        return self.vectorstore._collection.count()

    def reset_vectorstore(self) -> None:
        """Reset vector store completely (deletes all data)."""
        import chromadb

        client = chromadb.PersistentClient(path=self.persist_directory)
        try:
            client.delete_collection(LOG_COLLECTION_NAME)
            logger.info("Deleted collection: %s", LOG_COLLECTION_NAME)
        except ValueError:
            pass
        # Also clean up legacy 'langchain' collection if present
        try:
            client.delete_collection("langchain")
            logger.info("Deleted legacy 'langchain' collection")
        except ValueError:
            pass

        self.vectorstore = None
        self._initialized = False
