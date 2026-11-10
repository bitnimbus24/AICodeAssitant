from openai import OpenAI, OpenAIError
from app.config import settings

# Initialize Gemini client (OpenAI-compatible SDK)
client = OpenAI(
    api_key=settings.GEMINI_API_KEY,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)

LLM_MODEL = settings.LLM_MODEL  # "gemini-2.5-flash"

def generate_completion(prompt: str) -> str:
    """
    Generates completion from Gemini LLM.
    Handles quota or API key errors gracefully.
    """
    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {"role": "system", "content": "You are an expert coding assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        return response.choices[0].message.content

    except OpenAIError as e:
        # Graceful handling for Gemini quota or key issues
        if "insufficient_quota" in str(e):
            return "Gemini quota exceeded — please upgrade your plan or reduce request size."
        elif "invalid_api_key" in str(e):
            return "Invalid Gemini API key — check your .env configuration."
        return f"Gemini API error: {e}"
