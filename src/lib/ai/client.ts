import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// Groq — for all text AI (summaries, quizzes, chat)
// Free: 14,400 req/day, 30 req/min, no credit card
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// Groq helper — simple chat completion
export async function groqChat(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<string> {
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant", // fastest free model
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

// Gemini — ONLY for vision/OCR on scanned PDFs and images
// Only called when pdf-parse returns < 100 meaningful chars
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const geminiVision = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

// Strip ```json fences from model output
export function extractJSON(text: string): string {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}