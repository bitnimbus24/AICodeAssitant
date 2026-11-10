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

# CORS (frontend -> backend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can restrict this later to your frontend domain
    allow_credentials=True,
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
