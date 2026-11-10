from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import Settings
from app.routes import health, rag, upload, search, files

# Load environment settings
settings = Settings()

# Create FastAPI app
app = FastAPI(
    title="AI Codebase Assistant",
    description="Backend API for RAG-powered Codebase Assistant",
    version="1.0.0",
)

# CORS (frontend -> backend communication).
# Set CORS_ORIGINS to a comma-separated list of allowed origins in production,
# e.g. "https://my-app.vercel.app". "*" allows every origin.
cors_origins = [
    origin.strip()
    for origin in settings.CORS_ORIGINS.split(",")
    if origin.strip()
] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=cors_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health.router)
app.include_router(rag.router)
app.include_router(upload.router)
app.include_router(search.router)
app.include_router(files.router)


# Root endpoint (optional)
@app.get("/")
def root():
    return {"message": "AI Codebase Assistant Backend is running!"}
