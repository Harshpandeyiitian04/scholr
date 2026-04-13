import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { groqChat, extractJSON } from "@/lib/ai/client";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { documentId, questionTypes, difficulty, count } = body as {
      documentId: string;
      questionTypes: string[];
      difficulty: string;
      count: number;
    };

    if (!documentId || !questionTypes?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: doc } = await admin
      .from("documents")
      .select("title, extracted_text, summary")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single();

    if (!doc?.extracted_text) {
      return NextResponse.json({ error: "Document not ready or not found" }, { status: 404 });
    }

    // Cap text to avoid token limits
    const textForQuiz = doc.extracted_text.slice(0, 6000);
    const safeCount = Math.min(Math.max(count || 5, 3), 15);

    const typeInstructions: Record<string, string> = {
      mcq: `"mcq" questions with exactly 4 options array, correct_answer is the index (0-3)`,
      true_false: `"true_false" questions with options: ["True","False"], correct_answer is 0 (True) or 1 (False)`,
      fill_blank: `"fill_blank" questions where the question has a _____ blank, options is empty array [], correct_answer is the exact word/phrase string`,
      short_answer: `"short_answer" questions, options is empty array [], correct_answer is a concise string answer (max 10 words)`,
      assertion_reason: `"assertion_reason" questions with exactly 4 options: ["Both A and R are true and R is the correct explanation of A","Both A and R are true but R is not the correct explanation of A","A is true but R is false","A is false but R is true"], correct_answer is the index (0-3)`,
    };

    const selectedInstructions = questionTypes
      .filter((t) => typeInstructions[t])
      .map((t) => `- ${typeInstructions[t]}`)
      .join("\n");

    const prompt = `You are an expert exam paper setter for Indian engineering students (GATE/university exams).

Generate exactly ${safeCount} questions from the study material below.
Difficulty: ${difficulty}
Question types to include (distribute evenly): ${questionTypes.join(", ")}

STRICT JSON FORMAT — return ONLY a JSON array, no markdown, no explanation:
[
  {
    "id": "q1",
    "type": "mcq",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this answer is correct.",
    "difficulty": "${difficulty === "mixed" ? "easy|medium|hard" : difficulty}",
    "topic": "Topic name from the material"
  }
]

Type-specific rules:
${selectedInstructions}

Rules:
- Questions must be directly based on the provided text
- Explanations must reference the material
- For mixed difficulty, vary across easy/medium/hard
- No duplicate questions
- Keep questions clear and unambiguous

Study material:
${textForQuiz}

Return ONLY the JSON array:`;

    const raw = await groqChat(
      "You are an expert quiz generator. Return only valid JSON arrays. No markdown, no explanation, no extra text.",
      prompt,
      2048
    );

    let questions;
    try {
      const cleaned = extractJSON(raw);
      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions)) throw new Error("Not an array");
    } catch {
      console.error("Failed to parse quiz JSON:", raw.slice(0, 300));
      return NextResponse.json(
        { error: "AI returned invalid format. Please try again." },
        { status: 500 }
      );
    }

    // Sanitize questions
    questions = questions.slice(0, safeCount).map((q: Record<string, unknown>, i: number) => ({
      id: `q${i + 1}`,
      type: q.type ?? "mcq",
      question: String(q.question ?? ""),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correct_answer: q.correct_answer ?? 0,
      explanation: String(q.explanation ?? ""),
      difficulty: q.difficulty ?? difficulty,
      topic: String(q.topic ?? "General"),
    }));

    // Save quiz to DB
    const { data: quiz, error: quizErr } = await admin
      .from("quizzes")
      .insert({
        user_id: user.id,
        document_id: documentId,
        title: `${doc.title} — Quiz`,
        questions,
        difficulty,
        question_count: questions.length,
      })
      .select()
      .single();

    if (quizErr) throw new Error(quizErr.message);

    try { await admin.rpc("increment_queries", { user_id: user.id }); } catch {}

    return NextResponse.json({ quizId: quiz.id, questions: questions.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Quiz generation failed";
    console.error("Quiz generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}