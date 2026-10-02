import os
import math
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings

class LocalSemanticEmbeddingFunction:
    """
    Fallback deterministic multi-language aware semantic embedding generator.
    Produces 384-dimensional normalized vectors supporting English and Indian languages.
    """
    def __init__(self, dim: int = 384):
        self.dim = dim

    def name(self) -> str:
        return "LocalSemanticEmbeddingFunction"

    def is_legacy(self) -> bool:
        return False

    def embed_query(self, input: Any) -> List[List[float]]:
        if isinstance(input, str):
            input = [input]
        return self(input)

    def embed_documents(self, input: List[str]) -> List[List[float]]:
        return self(input)

    def __call__(self, input: List[str]) -> List[List[float]]:
        embeddings = []
        for text in input:
            vec = [0.0] * self.dim
            if not text:
                embeddings.append(vec)
                continue
            
            import hashlib
            
            # Extract word and character n-grams for multilingual resilience
            words = text.lower().split()
            for i, word in enumerate(words):
                # Use a stable hash instead of Python's randomized hash()
                h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16) % self.dim
                vec[h] += 1.0 / (1.0 + math.log1p(i))
                # 3-char n-grams for Indic script matching
                for j in range(len(word) - 2):
                    nh = int(hashlib.md5(word[j:j+3].encode('utf-8')).hexdigest(), 16) % self.dim
                    vec[nh] += 0.5
            
            # L2 normalize
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            embeddings.append([x / norm for x in vec])
        return embeddings

class VectorStoreService:
    _instance = None

    def __init__(self):
        os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIRECTORY,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        self.embedding_fn = LocalSemanticEmbeddingFunction()
        self.collection_name = "bharatsahay_documents"
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )

    @classmethod
    def get_instance(cls) -> "VectorStoreService":
        if cls._instance is None:
            cls._instance = VectorStoreService()
        return cls._instance

    def index_chunks(
        self,
        document_id: str,
        user_id: str,
        filename: str,
        chunks: List[Any]
    ) -> int:
        """
        Store chunks into ChromaDB with metadata for page-aware retrieval.
        """
        if not chunks:
            return 0

        ids = [f"{document_id}_{c.chunk_index}" for c in chunks]
        documents = [c.text for c in chunks]
        metadatas = [
            {
                "document_id": document_id,
                "user_id": user_id,
                "filename": filename,
                "page_number": int(c.page_number),
                "chunk_index": int(c.chunk_index),
            }
            for c in chunks
        ]

        # Chroma batches of 100
        batch_size = 100
        for i in range(0, len(ids), batch_size):
            end = i + batch_size
            self.collection.upsert(
                ids=ids[i:end],
                documents=documents[i:end],
                metadatas=metadatas[i:end]
            )

        return len(ids)

    def retrieve_relevant_chunks(
        self,
        query: str,
        document_id: Optional[str] = None,
        user_id: Optional[str] = None,
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Query vector collection with optional document_id and user_id scoping.
        """
        where_filter = {}
        if document_id and user_id:
            where_filter = {"$and": [{"document_id": document_id}, {"user_id": user_id}]}
        elif document_id:
            where_filter = {"document_id": document_id}
        elif user_id:
            where_filter = {"user_id": user_id}

        kwargs = {
            "query_texts": [query],
            "n_results": top_k
        }
        if where_filter:
            kwargs["where"] = where_filter

        results = self.collection.query(**kwargs)

        extracted: List[Dict[str, Any]] = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            ids = results["ids"][0] if "ids" in results else [""] * len(docs)

            for i in range(len(docs)):
                meta = metas[i] if i < len(metas) else {}
                extracted.append({
                    "id": ids[i],
                    "text": docs[i],
                    "page_number": meta.get("page_number", 1),
                    "filename": meta.get("filename", "Document"),
                    "document_id": meta.get("document_id", document_id or ""),
                    "distance": distances[i] if i < len(distances) else 0.0
                })

        return extracted

    def delete_document_vectors(self, document_id: str) -> None:
        """
        Delete all indexed vector chunks for a document.
        """
        try:
            self.collection.delete(where={"document_id": document_id})
        except Exception as e:
            # If collection was empty or items not found, ignore
            pass
