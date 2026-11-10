from fastapi import APIRouter, Query

from app.services.embeddings import get_embedding
from app.services.retriever import Retriever

router = APIRouter(
    prefix="/search",
    tags=["Search"]
)

retriever = Retriever()


@router.get("/")
def search_code(q: str = Query(..., min_length=1), k: int = Query(5, ge=1, le=20)):
    """Semantic search over the indexed codebase."""
    results = retriever.get_top_k(get_embedding(q), k=k)
    return {
        "query": q,
        "results": [
            {
                "path": item["metadata"].get("path"),
                "score": round(item["score"], 4),
                "text": item["text"],
            }
            for item in results
        ],
    }
