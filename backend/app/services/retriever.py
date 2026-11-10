from typing import List

import numpy as np

from app.services.vector_store import VectorStore


class Retriever:
    def __init__(self):
        self.vs = VectorStore()

    def cosine_similarity(self, vec1, vec2) -> float:
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2) + 1e-8)

    def get_top_k(self, query_embedding: list[float], k: int = 5) -> List[dict]:
        """
        Return the top-k most similar code chunks with their metadata.
        Each result: {"text": str, "score": float, "metadata": {"path": str, ...}}
        """
        results = []
        for item in self.vs.get_all().values():
            score = self.cosine_similarity(query_embedding, item["embedding"])
            results.append({
                "text": item["text"],
                "score": float(score),
                "metadata": item.get("metadata") or {},
            })

        results.sort(key=lambda item: item["score"], reverse=True)
        return results[:k]
