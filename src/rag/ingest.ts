import { createHash } from "node:crypto";
import { chunkText } from "./chunk";
import { embedText } from "../ai/embedding.ai";
import type { IVectorStore } from "../contracts/vector-store.interface";
import type { IVectorRecord } from "../contracts/vector-record.interface";

export async function ingestDocument(
  vectorStore: IVectorStore,
  document: { id?: string; content: string; source: string; title?: string }
) {
  const docId =
    document.id ||
    createHash("sha256").update(`${document.source}:${document.content}`).digest("hex").slice(0, 16);
  const chunks = chunkText(document.content);

  const records: IVectorRecord[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const vector = await embedText(chunk);

    records.push({
      id: `${docId}:${i}`,
      vector,
      payload: {
        content: chunk,
        source: document.source,
        chunkIndex: i,
        title: document.title,
      },
    });
  }

  await vectorStore.upsert(records);
}
