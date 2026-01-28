"""Embedding service for log vectorization and similarity search."""

import json
import os
from pathlib import Path
from typing import List, Tuple

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from app.models.schemas import LogDocument


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
        self.vectorstore: Chroma | None = None
        self._initialized = False

    def initialize_vectorstore(self, logs: List[LogDocument]) -> None:
        """Initialize vector store with log documents.

        Args:
            logs: List of log documents to vectorize.
        """
        if self._initialized:
            return

        # Convert logs to LangChain documents
        documents = [
            Document(
                page_content=log.to_text(),
                metadata=log.to_metadata(),
            )
            for log in logs
        ]

        # Create vector store
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
        )

        self._initialized = True

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

        Args:
            query: Search query (VOC content).
            k: Number of results to return.

        Returns:
            List of tuples (log_document, relevance_score).
        """
        if not self._initialized or self.vectorstore is None:
            raise RuntimeError("Vector store not initialized. Call initialize_vectorstore first.")

        # Perform similarity search with scores
        results = self.vectorstore.similarity_search_with_relevance_scores(
            query=query, k=k
        )

        # Convert results to LogDocument objects
        log_results = []
        for doc, score in results:
            log_doc = LogDocument(
                id=doc.metadata["id"],
                timestamp=doc.metadata["timestamp"],
                logLevel=doc.metadata["logLevel"],
                serviceName=doc.metadata["serviceName"],
                message=doc.metadata["message"],
                category=doc.metadata["category"],
                severity=doc.metadata["severity"],
            )
            log_results.append((log_doc, score))

        return log_results

    def is_initialized(self) -> bool:
        """Check if vector store is initialized."""
        return self._initialized

    def reset_vectorstore(self) -> None:
        """Reset vector store (for testing)."""
        self.vectorstore = None
        self._initialized = False
