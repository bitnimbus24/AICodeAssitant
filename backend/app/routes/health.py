from fastapi import APIRouter

router = APIRouter(
    prefix="/health",
    tags=["Health Check"]
)

@router.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "AI Codebase Assistant backend is healthy!"
    }
