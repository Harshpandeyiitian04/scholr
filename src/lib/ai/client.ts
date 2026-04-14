import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

/** Sends a single chat completion request to Groq and returns the response text. */
export async function groqChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const geminiVision = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

/** Strips markdown code-fence wrappers (```json ... ```) from AI-generated output so it can be parsed as JSON. */
export function extractJSON(text: string): string {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}
