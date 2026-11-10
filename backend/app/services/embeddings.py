import re
import time

from openai import OpenAI, OpenAIError
from app.config import settings

# Initialize Gemini client (OpenAI-compatible SDK)
client = OpenAI(
    api_key=settings.GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

EMBEDDING_MODEL = settings.EMBEDDING_MODEL  # "gemini-embedding-001"
EMBEDDING_BATCH_SIZE = 16

# Gemini's free tier allows 30k embedding tokens per minute. Stay under it
# so uploads succeed instead of failing with 429 errors.
TOKENS_PER_MINUTE_BUDGET = 24_000
MAX_RETRIES = 6


def _estimate_tokens(text: str) -> int:
    # Rough but safe: ~4 characters per token for source code.
    return max(1, len(text) // 4)


def _retry_delay(error: Exception) -> float:
    """Read the server-provided retry delay when available."""
    message = str(error)
    match = re.search(r"retry in ([\d.]+)s", message, re.IGNORECASE)
    if match:
        return min(65.0, float(match.group(1)) + 1.0)
    match = re.search(r"retryDelay'?\s*:?\s*'?(\d+)s", message, re.IGNORECASE)
    if match:
        return min(65.0, float(match.group(1)) + 1.0)
    return 15.0


def _is_rate_limit(error: Exception) -> bool:
    message = str(error).lower()
    return (
        "429" in message
        or "quota" in message
        or "rate limit" in message
        or "rate_limit" in message
        or "resource_exhausted" in message
    )


def _handle_error(e: OpenAIError):
    message = str(e)
    if _is_rate_limit(e):
        raise RuntimeError(
            "Gemini embedding rate limit reached. Wait about a minute and try again, "
            "or upload a smaller repository."
        )
    if "insufficient_quota" in message:
        raise RuntimeError("Gemini quota exceeded — please upgrade your plan or reduce request size.")
    if "invalid_api_key" in message:
        raise RuntimeError("Invalid Gemini API key — check your .env configuration.")
    raise RuntimeError(f"Gemini API error: {e}")


def _create_embeddings(batch: list[str]):
    """Call the embeddings API, retrying when the rate limit is hit."""
    for attempt in range(MAX_RETRIES):
        try:
            return client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        except OpenAIError as e:
            if _is_rate_limit(e) and attempt < MAX_RETRIES - 1:
                time.sleep(_retry_delay(e))
                continue
            _handle_error(e)
    raise RuntimeError("Gemini embedding request failed after retries.")


def get_embeddings(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for a list of text chunks using Gemini.
    Batches requests and paces them to stay within the free-tier
    tokens-per-minute limit.
    """
    if not texts:
        return []

    embeddings: list[list[float]] = []
    recent: list[tuple[float, int]] = []  # (timestamp, tokens) within the last minute

    for start in range(0, len(texts), EMBEDDING_BATCH_SIZE):
        batch = texts[start:start + EMBEDDING_BATCH_SIZE]
        batch_tokens = sum(_estimate_tokens(text) for text in batch)

        # Wait until this batch fits in the per-minute token budget.
        while True:
            now = time.time()
            recent = [(ts, tokens) for ts, tokens in recent if now - ts < 60]
            used = sum(tokens for _, tokens in recent)
            if used + batch_tokens <= TOKENS_PER_MINUTE_BUDGET or not recent:
                break
            wait = max(1.0, 60.0 - (now - recent[0][0]) + 0.5)
            time.sleep(min(wait, 30.0))

        response = _create_embeddings(batch)
        recent.append((time.time(), batch_tokens))

        data = response.data
        # Some OpenAI-compatible providers omit `index`; preserve order in that case.
        if all(isinstance(item.index, int) for item in data):
            data = sorted(data, key=lambda item: item.index)
        embeddings.extend(item.embedding for item in data)

    return embeddings


def get_embedding(text: str) -> list[float]:
    """Generate an embedding for a single text chunk using Gemini."""
    return get_embeddings([text])[0]
