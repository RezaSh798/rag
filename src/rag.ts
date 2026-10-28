import "dotenv/config";
import { QdrantDb } from "./database/qdrant.db";
import { ingestDocument } from "./rag/ingest";
import { answerWithRag } from "./rag/answer";
import type { IVectorStore } from "./contracts/vector-store.interface";

export async function runRagPipeline(
  userQuery: string,
  vectorStore: IVectorStore = new QdrantDb()
): Promise<string> {
  console.log("🔍 Searching relevant context & querying LLM...");
  return answerWithRag(vectorStore, userQuery, 2);
}

export { ingestDocument, answerWithRag };