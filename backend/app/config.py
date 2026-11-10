from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    VECTOR_DB_PATH: str = "app/database/vectorstore"
    LLM_MODEL: str = "gemini-3.5-flash-lite"
    EMBEDDING_MODEL: str = "gemini-embedding-001"
    # Comma-separated list of allowed frontend origins, e.g.
    # "https://my-app.vercel.app,http://localhost:8080". "*" allows all.
    CORS_ORIGINS: str = "*"

    class Config:
        env_file = ".env"

settings = Settings()
