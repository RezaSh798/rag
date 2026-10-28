export function buildRagPrompt(question: string, contextChunks: string[]): string {
  return `
You are a helpful assistant. Answer the user's question only using the context below.
If the answer is not in the context, say you do not know.

Context:
${contextChunks.map((chunk, i) => `[${i + 1}] ${chunk}`).join("\n\n")}

Question:
${question}
`.trim();
}
