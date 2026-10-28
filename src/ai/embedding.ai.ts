import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.EMBEDDING_BASE_URL,
  apiKey: process.env.EMBEDDING_API_KEY,
});

const MODEL: string = process.env.EMBEDDING_MODEL || 'dump-model';

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODEL,
    input: text,
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Embedding response is empty");
  }

  return embedding;
}
