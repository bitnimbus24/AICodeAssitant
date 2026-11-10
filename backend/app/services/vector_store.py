import threading
from pathlib import Path
import pickle

from app.config import Settings

settings = Settings()

# Resolve relative paths against backend/ so the app works from any directory.
BACKEND_DIR = Path(__file__).resolve().parents[2]
VECTOR_STORE_PATH = Path(settings.VECTOR_DB_PATH)
if not VECTOR_STORE_PATH.is_absolute():
    VECTOR_STORE_PATH = BACKEND_DIR / VECTOR_STORE_PATH

# Ensure vectorstore folder exists
VECTOR_STORE_PATH.mkdir(parents=True, exist_ok=True)


class VectorStore:
    # Single shared instance so uploads are immediately visible to the retriever
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.store_file = VECTOR_STORE_PATH / "vectors.pkl"
        self._lock = threading.Lock()
        if self.store_file.exists():
            try:
                with open(self.store_file, "rb") as f:
                    self.vectors = pickle.load(f)
            except (pickle.UnpicklingError, EOFError):
                self.vectors = {}
        else:
            self.vectors = {}  # {id: {"text": str, "embedding": list, "metadata": dict}}
        self._initialized = True

    def add_vector(self, id: str, text: str, embedding: list[float], metadata: dict | None = None):
        with self._lock:
            self.vectors[id] = {
                "text": text,
                "embedding": embedding,
                "metadata": metadata or {},
            }
            self._save()

    def add_vectors(self, items: list[dict]):
        """Insert many vectors and persist once. Each item: {id, text, embedding, metadata}."""
        with self._lock:
            for item in items:
                self.vectors[item["id"]] = {
                    "text": item["text"],
                    "embedding": item["embedding"],
                    "metadata": item.get("metadata") or {},
                }
            self._save()

    def clear(self):
        with self._lock:
            self.vectors = {}
            self._save()

    def _save(self):
        tmp_file = self.store_file.with_suffix(".tmp")
        with open(tmp_file, "wb") as f:
            pickle.dump(self.vectors, f)
        tmp_file.replace(self.store_file)

    def get_all(self):
        return self.vectors
