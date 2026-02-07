"""VOC Embedding service for similarity search using ChromaDB."""

import logging
from typing import List, Optional

from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

logger = logging.getLogger(__name__)

COSINE_METADATA = {"hnsw:space": "cosine"}


class VocEmbeddingService:
    """Service for embedding VOCs and performing similarity search.

    Uses a dedicated ChromaDB collection separate from the log embedding collection.
    """

    VOC_COLLECTION_NAME = "voc_embeddings"

    def __init__(
        self,
        model_name: str = "nomic-embed-text",
        ollama_base_url: str = "http://localhost:11434",
        persist_directory: str = "./chroma_db",
    ):
        """Initialize VOC embedding service.

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

    def _ensure_vectorstore(self) -> Chroma:
        """Ensure vector store is initialized (lazy initialization).

        Returns:
            Chroma vector store instance.
        """
        if self.vectorstore is None:
            self.vectorstore = Chroma(
                collection_name=self.VOC_COLLECTION_NAME,
                embedding_function=self.embeddings,
                persist_directory=self.persist_directory,
                collection_metadata=COSINE_METADATA,
            )
            self._initialized = True
            logger.info(
                "VOC vector store initialized with collection: %s",
                self.VOC_COLLECTION_NAME,
            )
        return self.vectorstore

    def index_voc(
        self,
        voc_id: int,
        title: str,
        content: str,
        category: Optional[str] = None,
    ) -> bool:
        """Index a VOC document into the vector store.

        Args:
            voc_id: VOC identifier.
            title: VOC title.
            content: VOC content.
            category: Optional VOC category.

        Returns:
            True if indexing was successful.
        """
        try:
            store = self._ensure_vectorstore()

            # Combine title and content for embedding
            page_content = f"{title}\n{content}"

            metadata = {
                "voc_id": voc_id,
                "title": title,
                "category": category or "unknown",
            }

            # Check if VOC already exists and remove it first (upsert behavior)
            existing = store.get(where={"voc_id": voc_id})
            if existing and existing.get("ids"):
                store.delete(ids=existing["ids"])
                logger.info("Removed existing embedding for VOC ID: %d", voc_id)

            # Add new document
            doc = Document(page_content=page_content, metadata=metadata)
            store.add_documents([doc])

            logger.info("Successfully indexed VOC ID: %d", voc_id)
            return True

        except Exception as e:
            logger.error("Failed to index VOC ID %d: %s", voc_id, str(e))
            raise

    def search_similar(
        self,
        query_text: str,
        limit: int = 5,
    ) -> List[dict]:
        """Search for VOCs similar to the query text.

        Args:
            query_text: Search query (VOC content).
            limit: Number of results to return.

        Returns:
            List of dicts with voc_id, similarity, and title.
        """
        try:
            store = self._ensure_vectorstore()

            # Check if the collection has any documents
            collection_count = store._collection.count()
            if collection_count == 0:
                logger.info("VOC collection is empty, returning no results")
                return []

            # Perform similarity search with scores
            results = store.similarity_search_with_relevance_scores(
                query=query_text, k=min(limit, collection_count)
            )

            similar_vocs = []
            for doc, score in results:
                # Normalize score to 0.0 - 1.0 range
                normalized_score = max(0.0, min(1.0, score))

                similar_vocs.append(
                    {
                        "voc_id": doc.metadata.get("voc_id", 0),
                        "similarity": round(normalized_score, 4),
                        "title": doc.metadata.get("title", ""),
                    }
                )

            logger.info(
                "Found %d similar VOCs for query (limit=%d)",
                len(similar_vocs),
                limit,
            )
            return similar_vocs

        except Exception as e:
            logger.error("Failed to search similar VOCs: %s", str(e))
            raise

    def is_initialized(self) -> bool:
        """Check if the VOC vector store is initialized."""
        return self._initialized

    def get_collection_count(self) -> int:
        """Get the number of documents in the VOC collection.

        Returns:
            Number of indexed VOC documents.
        """
        try:
            store = self._ensure_vectorstore()
            return store._collection.count()
        except Exception:
            return 0

    def reset_vectorstore(self) -> None:
        """Reset vector store (for testing)."""
        self.vectorstore = None
        self._initialized = False
