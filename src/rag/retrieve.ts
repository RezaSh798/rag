import { embedText } from "../ai/embedding.ai";
import type { IVectorStore } from "../contracts/vector-store.interface";

export async function retrieveRelevantChunks(
  vectorStore: IVectorStore,
  query: string,
  limit = 2
) {
  const queryVector = await embedText(query);
  const records = await vectorStore.search(queryVector, limit);

  return records.map((record) => record.payload.content);
}
