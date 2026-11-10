from fastapi import APIRouter, HTTPException
from app.models.rag_models import RAGRequest, RAGResponse
from app.services.rag_pipeline import run_rag_pipeline
from openai import OpenAIError

router = APIRouter(
    prefix="/generate",
    tags=["RAG"]
)

@router.post("/", response_model=RAGResponse)
def generate_rag_answer(request: RAGRequest):
    """
    Accepts a query and returns an answer using the RAG pipeline
    """
    try:
        answer = run_rag_pipeline(request.query)
        return RAGResponse(answer=answer)

    except OpenAIError as e:
        # Catch OpenAI-specific errors like quota or invalid key
        if "insufficient_quota" in str(e):
            raise HTTPException(
                status_code=429,
                detail="OpenAI quota exceeded. Please upgrade your plan or reduce request size."
            )
        elif "invalid_api_key" in str(e):
            raise HTTPException(
                status_code=401,
                detail="Invalid OpenAI API key. Please check your .env configuration."
            )
        else:
            raise HTTPException(status_code=500, detail=f"OpenAI API error: {e}")

    except Exception as e:
        # Catch all other errors
        raise HTTPException(status_code=500, detail=str(e))
