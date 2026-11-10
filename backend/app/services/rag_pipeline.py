"""
RAG Pipeline - retrieves relevant code chunks and asks Gemini for an answer.
"""

from app.services.embeddings import get_embedding
from app.services.retriever import Retriever
from app.services.llm import generate_completion

# Initialize retriever
retriever = Retriever()

NO_CONTEXT_MESSAGE = (
    "I don't have any code indexed yet. Upload a repository on the Upload page, "
    "then ask your question again."
)


def run_rag_pipeline(query: str) -> str:
    """
    1. Generate embedding for query
    2. Retrieve top-k relevant code chunks
    3. Pass retrieved context + query to the LLM
    4. Return the answer
    """
    if not query or not query.strip():
        return "Please ask a question about your codebase."

    # Step 1: Get embedding for query
    query_embedding = get_embedding(query)

    # Step 2: Retrieve top 5 similar code chunks
    top_chunks = retriever.get_top_k(query_embedding, k=5)

    if not top_chunks:
        return NO_CONTEXT_MESSAGE

    # Combine retrieved text as context, labelled with file paths
    context_blocks = []
    for chunk in top_chunks:
        path = chunk["metadata"].get("path") or "unknown file"
        context_blocks.append(f"--- {path} ---\n{chunk['text']}")
    context_text = "\n\n".join(context_blocks)

    # Step 3: Generate answer using the LLM
    prompt = (
        "You are helping a developer understand their codebase. "
        "Use only the code context below to answer the question. "
        "When you reference code, mention the file path it came from. "
        "If the context does not contain the answer, say so honestly.\n\n"
        f"{context_text}\n\n"
        f"Question: {query}\n"
        "Answer:"
    )
    return generate_completion(prompt)
