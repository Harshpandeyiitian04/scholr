import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { answers, timeTaken } = await req.json() as {
      answers: Record<string, string | number>;
      timeTaken: number;
    };

    const admin = createAdminClient();
    const { data: quiz } = await admin
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

    // Grade answers
    let score = 0;
    const gradedAnswers = quiz.questions.map((q: {
      id: string;
      correct_answer: string | number;
      explanation: string;
      topic: string;
      difficulty: string;
    }) => {
      const userAnswer = answers[q.id];
      const isCorrect =
        String(userAnswer).trim().toLowerCase() ===
        String(q.correct_answer).trim().toLowerCase();
      if (isCorrect) score++;
      return {
        questionId: q.id,
        userAnswer,
        correct_answer: q.correct_answer,
        isCorrect,
        explanation: q.explanation,
        topic: q.topic,
        difficulty: q.difficulty,
      };
    });

    // Save attempt
    const { data: attempt } = await admin
      .from("quiz_attempts")
      .insert({
        user_id: user.id,
        quiz_id: id,
        answers: gradedAnswers,
        score,
        total: quiz.questions.length,
        time_taken: timeTaken,
      })
      .select()
      .single();

    return NextResponse.json({
      attemptId: attempt?.id,
      score,
      total: quiz.questions.length,
      gradedAnswers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}