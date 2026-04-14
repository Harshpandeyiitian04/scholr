import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { geminiVision, groqChat } from "@/lib/ai/client";

export const maxDuration = 60;

/** Retries an async function up to `retries` times, doubling the wait after each 429 rate-limit error before re-throwing any other error. */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 5000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const is429 =
        err instanceof Error &&
        (err.message.includes("429") ||
          err.message.includes("Too Many Requests"));
      if (is429 && i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

/** Converts a Node.js Buffer to the inline data object format expected by the Gemini Vision API. */
function bufferToInlineData(buffer: Buffer, mimeType: string) {
  return { inlineData: { data: buffer.toString("base64"), mimeType } };
}

/** Scores each sentence by the ratio of content words to total words and returns the top three most information-dense sentences joined into a single summary string. Used as a local fallback when the AI summary call is rate-limited. */
function generateLocalSummary(text: string, fileName: string): string {
  const cleaned = text.replace(/\s+/g, " ").trim();

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 40 && s.length < 400);

  if (sentences.length === 0) {
    const words = cleaned.split(" ").slice(0, 40).join(" ");
    return `${words}...`;
  }

  const stopWords = new Set([
    "the", "a", "an", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "shall", "can",
    "this", "that", "these", "those", "it", "its", "in", "on",
    "at", "to", "for", "of", "and", "or", "but", "with", "as",
  ]);

  const scored = sentences.map((s) => {
    const words = s.toLowerCase().split(/\s+/);
    const contentWords = words.filter((w) => !stopWords.has(w) && w.length > 3);
    return { s, score: contentWords.length / words.length };
  });

  const top = scored
    .map((x, i) => ({ ...x, i }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.s);

  return top.join(" ");
}

/** Downloads the uploaded document, extracts its text (pdf-parse for PDFs, mammoth for DOCX, Gemini Vision for scanned PDFs/images/PPTX), generates an AI summary via Groq (falling back to a local summary on rate-limit), and saves everything to the database with status "ready". */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    const { data: doc, error: docErr } = await admin
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (docErr || !doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const { data: fileBlob, error: fileErr } = await admin.storage
      .from("documents")
      .download(doc.file_path);

    if (fileErr || !fileBlob) {
      await admin.from("documents").update({ status: "failed" }).eq("id", id);
      return NextResponse.json(
        { error: "Could not download file" },
        { status: 500 },
      );
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    let extractedText = "";
    let usedVision = false;

    if (doc.file_type === "application/pdf") {
      try {
        const pdfParse = await import("pdf-parse/lib/pdf-parse.js");
        const pdfParseDefault = (
          pdfParse as unknown as {
            default: (b: Buffer) => Promise<{ text: string }>;
          }
        ).default ?? pdfParse;
        const pdfData = await pdfParseDefault(buffer);
        extractedText = pdfData.text ?? "";
        console.log(
          `pdf-parse: ${extractedText.replace(/\s/g, "").length} chars`
        );
      } catch {
        extractedText = "";
      }

      if (extractedText.replace(/\s+/g, "").length < 100) {
        console.log("Scanned PDF → Gemini Vision OCR");
        usedVision = true;
        const result = await withRetry(() =>
          geminiVision.generateContent([
            bufferToInlineData(buffer, "application/pdf"),
            "Extract ALL text from this document. Preserve headings, equations, bullet points. Return only the text.",
          ])
        );
        extractedText = result.response.text();
      }

    } else if (
      doc.file_type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      doc.file_type === "application/msword"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value ?? "";

    } else if (
      doc.file_type ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    ) {
      usedVision = true;
      const result = await withRetry(() =>
        geminiVision.generateContent([
          bufferToInlineData(buffer, doc.file_type),
          "Extract all text slide by slide. Format: Slide 1:\n[content]\n\nSlide 2:\n[content]",
        ])
      );
      extractedText = result.response.text();

    } else if (doc.file_type.startsWith("image/")) {
      usedVision = true;
      const result = await withRetry(() =>
        geminiVision.generateContent([
          bufferToInlineData(buffer, doc.file_type),
          "Extract all text from this image. Preserve structure and formatting.",
        ])
      );
      extractedText = result.response.text();
    }

    if (!extractedText || extractedText.trim().length < 10) {
      await admin.from("documents").update({ status: "failed" }).eq("id", id);
      return NextResponse.json(
        { error: "No readable text found in this file." },
        { status: 422 }
      );
    }

    let summary = "";
    let summaryRateLimited = false;
    try {
      summary = await groqChat(
        "You are an expert academic summarizer for Indian engineering students. Be concise.",
        `Summarize this study material in 3-4 sentences. Cover: what subject/topic, key concepts, what matters for exams. No fluff.\n\nText:\n${extractedText.slice(0, 3000)}`,
        256
      );
      summary = summary.trim();
    } catch (summaryErr: unknown) {
      const msg =
        summaryErr instanceof Error ? summaryErr.message : String(summaryErr);
      if (msg.includes("429") || msg.includes("Too Many Requests")) {
        console.log("Summary rate-limited — falling back to local summary");
        summaryRateLimited = true;
        summary = generateLocalSummary(extractedText, doc.file_name);
      } else {
        throw summaryErr;
      }
    }

    await admin
      .from("documents")
      .update({
        extracted_text: extractedText.slice(0, 40000),
        summary,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    try {
      await admin.rpc("increment_queries", { user_id: user.id });
    } catch {}

    return NextResponse.json({ success: true, summary, usedVision, summaryRateLimited });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing failed";
    console.error("Processing error:", message);

    if (message.includes("429") || message.includes("Too Many Requests")) {
      return NextResponse.json(
        {
          error:
            "Gemini free tier rate limit hit. Wait 1 minute and try uploading again.",
        },
        { status: 429 },
      );
    }

    try {
      const admin = createAdminClient();
      await admin.from("documents").update({ status: "failed" }).eq("id", id);
    } catch {}

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
