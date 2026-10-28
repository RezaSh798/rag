# Bun RAG Engine

A lightweight, modular, and extensible **Retrieval-Augmented Generation (RAG)** engine implemented in **TypeScript** using the **[Bun](https://bun.com)** runtime, **[Qdrant](https://qdrant.tech)** vector database, and OpenAI-compatible API providers (such as OmniRoute, Gemini, or OpenAI).

---

## Features

- **Blazing Fast Runtime**: Built on Bun with zero-config TypeScript execution and native test runner.
- **Modular Pipeline**: Decoupled modules for chunking, embedding, vector storage, context retrieval, and response generation.
- **Pluggable Vector Store**: `IVectorStore` interface abstraction with a fully-featured `QdrantDb` implementation:
  - Automatic collection creation and dimension configuration.
  - Deterministic UUID mapping for custom chunk IDs.
  - Cosine distance similarity search.
- **Provider Agnostic**: OpenAI SDK-compatible integration allowing plug-and-play usage with OmniRoute, Google Gemini, OpenAI, or any self-hosted model gateway.
- **Unit Tested**: Comprehensive test suite using `bun:test` with mocked vector store behaviors.

---

## Architecture Flow

```
[ Ingestion Flow ]
Raw Document ───► Sliding Window Chunking ───► Text Embedding ───► Qdrant Vector Upsert
                   (chunkSize & overlap)        (embedText)           (IVectorStore)

[ Query Flow ]
User Query ───► Query Embedding ───► Vector Search (Top-K) ───► Grounded Prompt ───► LLM Completion
                  (embedText)          (Cosine Similarity)        (buildRagPrompt)     (generateAnswer)
```

---

## Project Structure

```
bun-rag-engin/
├── index.ts                     # Application entry point (CLI runner)
├── src/
│   ├── rag.ts                   # Main RAG orchestrator exports
│   ├── ai/
│   │   ├── chat.ai.ts           # LLM chat completion client
│   │   └── embedding.ai.ts      # Text embedding client
│   ├── contracts/
│   │   ├── vector-record.interface.ts # Vector payload and record types
│   │   └── vector-store.interface.ts  # Generic vector store interface
│   ├── database/
│   │   └── qdrant.db.ts         # Qdrant client implementation
│   └── rag/
│       ├── chunk.ts             # Text splitter with sliding window overlap
│       ├── ingest.ts            # Document chunking & embedding ingestion
│       ├── retrieve.ts          # Vector similarity search retriever
│       ├── prompt.ts            # Grounded prompt template builder
│       └── answer.ts            # End-to-end RAG question answering
├── tests/
│   └── qdrant.db.test.ts        # Unit tests for vector store operations
├── .env.example                 # Environment variables template
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Project dependencies & scripts
```

---

## Prerequisites

- **[Bun](https://bun.sh)** (v1.0.0 or higher)
- **Qdrant Vector Database** (running locally via Docker or a remote instance)
- API credentials for:
  - Chat/LLM completions
  - Text embeddings

---

## Getting Started

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your configuration:

```env
# LLM Chat Completion (e.g. OmniRoute / OpenAI / Gemini)
OMNIROUTE_BASE_URL=https://api.omniroute.ai/v1
OMNIROUTE_API_KEY=your_api_key_here
OMNIROUTE_MODEL=gemini-1.5-flash

# Embeddings API
EMBEDDING_BASE_URL=https://api.omniroute.ai/v1
EMBEDDING_API_KEY=your_api_key_here
EMBEDDING_MODEL=text-embedding-3-small

# Vector Database (Qdrant)
QDRANT_URL=http://localhost:6333
# QDRANT_API_KEY=your_qdrant_key_optional
# QDRANT_COLLECTION=rag_knowledge_base
# QDRANT_VECTOR_SIZE=1536
```

### 3. Run Qdrant (Local Docker)

If you don't already have Qdrant running:

```bash
docker run -d -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant
```

---

## Usage

### Ingest Documents and Query

Run the pipeline with the `--ingest` flag to index sample content into Qdrant before querying:

```bash
bun run index.ts --ingest
```

### Query Existing Knowledge Base

Once documents are indexed, run queries without re-ingesting:

```bash
bun run index.ts
```

### Programmatic Usage

You can import and use the RAG pipeline directly in your TypeScript code:

```typescript
import { runRagPipeline, ingestDocument } from "./src/rag";
import { QdrantDb } from "./src/database/qdrant.db";

const db = new QdrantDb();

// 1. Ingest a document
await ingestDocument(db, {
  content: "Bun is a modern all-in-one JavaScript runtime with native TypeScript support.",
  source: "documentation.txt",
  title: "Bun Overview",
});

// 2. Query the pipeline
const answer = await runRagPipeline("What is Bun?", db);
console.log(answer);
```

---

## Development & Verification

### Run Tests

Execute unit tests with Bun's built-in test runner:

```bash
bun test
```

### Type Checking

Verify TypeScript types:

```bash
bun check
```

### Code Formatting

Format source files:

```bash
bun fmt
```

---

## Configuration Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `OMNIROUTE_BASE_URL` | Base URL for LLM chat completion API | _None (Required)_ |
| `OMNIROUTE_API_KEY` | API key for LLM provider | _None (Required)_ |
| `OMNIROUTE_MODEL` | Model ID for chat completions | `dump-model` |
| `EMBEDDING_BASE_URL` | Base URL for text embeddings API | _None (Required)_ |
| `EMBEDDING_API_KEY` | API key for embedding provider | _None (Required)_ |
| `EMBEDDING_MODEL` | Model ID for generating embeddings | `dump-model` |
| `QDRANT_URL` | URL of the Qdrant instance | `http://localhost:6333` |
| `QDRANT_API_KEY` | Optional API key for Qdrant Cloud | `undefined` |
| `QDRANT_COLLECTION` | Qdrant collection name | `rag_knowledge_base` |
| `QDRANT_VECTOR_SIZE` | Vector dimension size | `1536` |

---

## License

Private / MIT
