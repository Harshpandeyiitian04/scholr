import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { groq } from "@/lib/ai/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { documentId, message, history } = await req.json() as {
      documentId: string;
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
    };

    if (!documentId || !message?.trim()) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch document text
    const { data: doc } = await admin
      .from("documents")
      .select("title, extracted_text, summary")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (!doc?.extracted_text) {
      return NextResponse.json({ error: "Document not ready" }, { status: 404 });
    }

    // Simple keyword-based context retrieval
    // Split text into chunks and find relevant ones
    const chunkSize = 800;
    const chunks: string[] = [];
    const text = doc.extracted_text;
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    // Score chunks by keyword overlap with the question
    const queryWords = message
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const scored = chunks
      .map((chunk, i) => {
        const lower = chunk.toLowerCase();
        const score = queryWords.reduce(
          (acc, word) => acc + (lower.includes(word) ? 1 : 0),
          0
        );
        return { chunk, score, i };
      })
      .sort((a, b) => b.score - a.score);

    // Take top 3 most relevant chunks
    const relevantContext = scored
      .slice(0, 3)
      .sort((a, b) => a.i - b.i)
      .map((c) => c.chunk)
      .join("\n\n");

    // Build conversation history for Groq (last 6 messages max)
    const recentHistory = history.slice(-6);

    const systemPrompt = `You are an expert AI tutor helping an Indian engineering student study their notes.

You ONLY answer based on the document context provided below. If the answer is not in the context, say "I couldn't find that in this document" and suggest what topics are covered.

Document title: "${doc.title}"
Document summary: ${doc.summary ?? "No summary available"}

Relevant context from the document:
---
${relevantContext}
---

Rules:
- Answer clearly and concisely
- Reference specific parts of the document when possible
- For formulas or equations, explain them step by step
- If asked for examples, create them based on concepts in the document
- Keep answers focused and exam-relevant
- Use simple language suitable for engineering students`;

    // Streaming response
    const stream = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...recentHistory,
        { role: "user", content: message },
      ],
    });

    // Save user message to DB (don't await — fire and forget)
    admin.from("chats").insert([
      {
        user_id: user.id,
        document_id: documentId,
        role: "user",
        content: message,
      },
    ]).then(() => {}, () => {});

    // Stream tokens back to client
    const encoder = new TextEncoder();
    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content ?? "";
            if (token) {
              fullResponse += token;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();

          // Save assistant response after streaming completes
          admin.from("chats").insert([{
            user_id: user.id,
            document_id: documentId,
            role: "assistant",
            content: fullResponse,
          }]).then(() => {}, () => {});

          try { await admin.rpc("increment_queries", { user_id: user.id }); } catch {}
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}