# AI Codebase Assistant

A full-stack **RAG (Retrieval-Augmented Generation)** app that lets you chat with any codebase. Upload a repository as a `.zip`, and ask natural-language questions — the assistant answers using the actual source code and cites the files it used.

## Features

- **Repository upload** — drop a `.zip` or a single source file; code is extracted, chunked, embedded, and indexed.
- **Smart filtering** — skips `node_modules`, `.git`, `venv`, build output, binaries, and hidden files automatically.
- **Chat with your code** — answers are generated from retrieved code chunks and include file paths.
- **File explorer** — browse the indexed repository and open real file contents in the UI.
- **Semantic search** — `/search` returns the most relevant code chunks with similarity scores.
- **Conversation history** — previous questions are kept in the browser.
- **Rate-limit aware** — embedding requests are paced and retried automatically to stay within Gemini's free tier.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | FastAPI, Python, Uvicorn |
| LLM | Gemini (`gemini-3.5-flash-lite`) via the OpenAI-compatible API |
| Embeddings | Gemini (`gemini-embedding-001`, 3072 dimensions) |
| Vector store | NumPy cosine similarity + a local pickle store |

## Project Structure

```
AICodeAssitant/
├── backend/
│   ├── app/
│   │   ├── routes/          # health, upload, generate, search, files
│   │   ├── services/        # embeddings, chunker, retriever, RAG, vector store
│   │   ├── config.py        # environment settings
│   │   └── main.py          # FastAPI app + CORS
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    └── src/
        ├── lib/api.ts       # backend API client
        ├── pages/           # Home, Upload, Chat, History, Docs
        └── components/      # chat, upload, code viewer, UI kit
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `backend/.env` and set your key:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

Start the API:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
```

- API: http://127.0.0.1:8000
- Interactive docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health/

### 2. Frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:8080**, upload a repository, then start chatting.

> On Windows, if `npm` is blocked by the execution policy, use `npm.cmd` instead.

## Environment Variables

| Variable | Default | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | *(required)* | Gemini API key |
| `LLM_MODEL` | `gemini-3.5-flash-lite` | Chat model |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | Embedding model |
| `VECTOR_DB_PATH` | `app/database/vectorstore` | Where vectors are persisted |

The frontend talks to `http://127.0.0.1:8000` by default. Override it with `VITE_API_URL`.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health/` | Service health check |
| `POST` | `/upload/` | Upload a `.zip` or source file (`multipart/form-data`, field `file`) |
| `POST` | `/generate/` | Ask a question — body: `{"query": "..."}` |
| `GET` | `/search/?q=...&k=5` | Semantic search over indexed chunks |
| `GET` | `/files/` | Current repository metadata and file list |
| `GET` | `/files/content?path=...` | Text content of an indexed file |
| `DELETE` | `/files/` | Clear the repository, files, and vectors |

### Example

```bash
curl -X POST http://localhost:8000/upload/ -F "file=@repository.zip"

curl -X POST http://localhost:8000/generate/ \
  -H "Content-Type: application/json" \
  -d '{"query": "How does authentication work?"}'
```

## How It Works

1. **Extract** — the uploaded archive is unpacked and only supported source files are kept.
2. **Chunk** — files are split into overlapping ~800-character chunks.
3. **Embed** — chunks are embedded with Gemini in paced batches.
4. **Store** — vectors and file metadata are persisted locally.
5. **Retrieve** — a question is embedded and the top-k chunks are found by cosine similarity.
6. **Generate** — the chunks are passed to the LLM with instructions to cite file paths.

## Limits & Notes

- Each upload replaces the previously indexed repository.
- Per upload: up to 400 files, 512 KB per file, and 250 chunks are indexed.
- Gemini's free tier allows ~30k embedding tokens per minute; large repositories take **1–2 minutes** to index.
- Vectors and uploaded files are stored under `backend/app/database/` and `backend/app/workspace/` (both gitignored).
- `backend/.env` is gitignored — never commit your API key.

## Credits

Originally started as a team project with [Subham Kumar Mohanty](https://github.com/subhamkumar584). This version extends it with end-to-end repository upload, retrieval, and chat integration.

## License

This project is open for learning and personal use.
