import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.OMNIROUTE_BASE_URL,
  apiKey: process.env.OMNIROUTE_API_KEY,
});

const MODEL: string = process.env.OMNIROUTE_MODEL || "dump-model";

export async function generateAnswer(prompt: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You answer questions based only on provided context.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Completion response content is empty");
  }

  return content;
}
