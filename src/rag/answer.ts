import type { IVectorStore } from "../contracts/vector-store.interface";
import { retrieveRelevantChunks } from "./retrieve";
import { buildRagPrompt } from "./prompt";
import { generateAnswer } from "../ai/chat.ai";

export async function answerWithRag(
  vectorStore: IVectorStore,
  question: string,
  limit = 2
): Promise<string> {
  const relevantChunks = await retrieveRelevantChunks(vectorStore, question, limit);
  const prompt = buildRagPrompt(question, relevantChunks);
  return generateAnswer(prompt);
}
