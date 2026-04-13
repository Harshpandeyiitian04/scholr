import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Run all queries in parallel
    const [
      { data: profile },
      { data: documents, count: docCount },
      { data: quizzes, count: quizCount },
      { data: attempts },
      { data: chats, count: chatCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("documents")
        .select("id, title, status, created_at, file_size", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("quizzes")
        .select("id, title, difficulty, question_count, created_at", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("quiz_attempts")
        .select("id, quiz_id, score, total, time_taken, answers, completed_at")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: true }),
      supabase
        .from("chats")
        .select("id, created_at", { count: "exact" })
        .eq("user_id", user.id)
        .eq("role", "user"),
    ]);

    // ── Quiz performance metrics ───────────────────────────────────────────
    const attemptList = attempts ?? [];
    const totalAttempts = attemptList.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(
            (attemptList.reduce((acc, a) => acc + (a.score / a.total) * 100, 0) /
              totalAttempts) *
              10
          ) / 10
        : 0;

    const bestScore =
      totalAttempts > 0
        ? Math.round(
            Math.max(...attemptList.map((a) => (a.score / a.total) * 100))
          )
        : 0;

    // ── Score over time (last 14 attempts) ────────────────────────────────
    const scoreHistory = attemptList.slice(-14).map((a) => ({
      date: new Date(a.completed_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      score: Math.round((a.score / a.total) * 100),
      raw: `${a.score}/${a.total}`,
    }));

    // ── Weak topics (from wrong answers) ──────────────────────────────────
    const topicErrors: Record<string, { wrong: number; total: number }> = {};
    attemptList.forEach((attempt) => {
      const answers = attempt.answers as {
        isCorrect: boolean;
        topic: string;
      }[];
      if (!Array.isArray(answers)) return;
      answers.forEach((ans) => {
        const t = ans.topic ?? "General";
        if (!topicErrors[t]) topicErrors[t] = { wrong: 0, total: 0 };
        topicErrors[t].total++;
        if (!ans.isCorrect) topicErrors[t].wrong++;
      });
    });

    const weakTopics = Object.entries(topicErrors)
      .map(([topic, { wrong, total }]) => ({
        topic,
        wrong,
        total,
        errorRate: Math.round((wrong / total) * 100),
      }))
      .filter((t) => t.total >= 2)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, 8);

    // ── Difficulty breakdown ──────────────────────────────────────────────
    const difficultyMap: Record<string, { correct: number; total: number }> = {};
    attemptList.forEach((attempt) => {
      const answers = attempt.answers as {
        isCorrect: boolean;
        difficulty: string;
      }[];
      if (!Array.isArray(answers)) return;
      answers.forEach((ans) => {
        const d = ans.difficulty ?? "medium";
        if (!difficultyMap[d]) difficultyMap[d] = { correct: 0, total: 0 };
        difficultyMap[d].total++;
        if (ans.isCorrect) difficultyMap[d].correct++;
      });
    });

    const difficultyStats = ["easy", "medium", "hard"].map((d) => ({
      difficulty: d,
      correct: difficultyMap[d]?.correct ?? 0,
      total: difficultyMap[d]?.total ?? 0,
      rate:
        difficultyMap[d]?.total > 0
          ? Math.round((difficultyMap[d].correct / difficultyMap[d].total) * 100)
          : null,
    }));

    // ── Activity heatmap (last 30 days) ───────────────────────────────────
    const now = new Date();
    const activityMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      activityMap[d.toISOString().slice(0, 10)] = 0;
    }

    // Count quiz attempts per day
    attemptList.forEach((a) => {
      const day = a.completed_at.slice(0, 10);
      if (activityMap[day] !== undefined) activityMap[day]++;
    });

    // Count chat messages per day
    (chats ?? []).forEach((c: { created_at: string }) => {
      const day = c.created_at.slice(0, 10);
      if (activityMap[day] !== undefined) activityMap[day]++;
    });

    const activityData = Object.entries(activityMap).map(([date, count]) => ({
      date,
      count,
      day: new Date(date).toLocaleDateString("en-IN", { weekday: "short" }),
    }));

    // ── Study streak ──────────────────────────────────────────────────────
    let streak = 0;
    const today = new Date().toISOString().slice(0, 10);
    const days = Object.keys(activityMap).sort().reverse();
    for (const day of days) {
      if (activityMap[day] > 0) streak++;
      else if (day !== today) break;
    }

    // ── Total study time estimate (avg 2 min per quiz question) ──────────
    const totalMinutes = attemptList.reduce((acc, a) => {
      return acc + (a.time_taken ? Math.floor(a.time_taken / 60) : a.total * 2);
    }, 0);

    return NextResponse.json({
      overview: {
        documents: docCount ?? 0,
        quizzes: quizCount ?? 0,
        attempts: totalAttempts,
        avgScore,
        bestScore,
        streak,
        totalMinutes,
        chatMessages: chatCount ?? 0,
        queriesUsed: profile?.queries_used ?? 0,
      },
      scoreHistory,
      weakTopics,
      difficultyStats,
      activityData,
      recentDocs: (documents ?? []).slice(0, 5),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Analytics failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}