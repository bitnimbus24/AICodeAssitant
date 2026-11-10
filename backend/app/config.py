from pathlib import Path

from pydantic_settings import BaseSettings

# backend/ directory, independent of the current working directory
BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    VECTOR_DB_PATH: str = "app/database/vectorstore"
    LLM_MODEL: str = "gemini-3.5-flash-lite"
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    # Comma-separated list of allowed frontend origins, e.g.
    # "https://my-app.vercel.app,http://localhost:8080". "*" allows all.
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = str(BACKEND_DIR / ".env")


settings = Settings()
