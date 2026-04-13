"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Quiz, QuizQuestion } from "@/types/database";

export default function TakeQuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [current, setCurrent] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    gradedAnswers: {
      questionId: string;
      userAnswer: string | number;
      correct_answer: string | number;
      isCorrect: boolean;
      explanation: string;
      topic: string;
    }[];
  } | null>(null);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("quizzes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          toast.error("Quiz not found");
          router.push("/quizzes");
          return;
        }
        setQuiz(data as Quiz);
        setLoading(false);
      });
  }, [id, router]);

  // Timer
  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [submitted, startTime]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleAnswer = useCallback(
    (questionId: string, value: string | number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  async function handleSubmit() {
    if (!quiz) return;
    const unanswered = quiz.questions.filter((q) => answers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast.error(`${unanswered.length} question(s) unanswered. Answer all to submit.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/quizzes/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timeTaken: elapsed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-zinc-500">
        <Loader2 size={16} className="animate-spin" />
        Loading quiz...
      </div>
    );
  }

  if (!quiz) return null;

  // ── Results screen ────────────────────────────────────────────────────────
  if (submitted && results) {
    const pct = Math.round((results.score / results.total) * 100);
    const grade =
      pct >= 80 ? { label: "Excellent", color: "text-green-400" } :
      pct >= 60 ? { label: "Good", color: "text-amber-400" } :
      pct >= 40 ? { label: "Needs work", color: "text-orange-400" } :
                  { label: "Keep studying", color: "text-red-400" };

    // Group wrong answers by topic
    const wrongByTopic: Record<string, number> = {};
    results.gradedAnswers.forEach((a) => {
      if (!a.isCorrect) {
        wrongByTopic[a.topic] = (wrongByTopic[a.topic] ?? 0) + 1;
      }
    });

    return (
      <div className="p-6 max-w-2xl">
        {/* Score card */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-6 mb-6 text-center">
          <div className="text-6xl font-bold text-white mb-1">
            {results.score}
            <span className="text-3xl text-zinc-500">/{results.total}</span>
          </div>
          <p className={cn("text-lg font-medium mb-1", grade.color)}>
            {grade.label}
          </p>
          <p className="text-zinc-600 text-sm">{pct}% · {formatTime(elapsed)}</p>

          {Object.keys(wrongByTopic).length > 0 && (
            <div className="mt-4 p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-left">
              <p className="text-xs font-medium text-red-400 mb-2">Weak areas to revise:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(wrongByTopic).map(([topic, count]) => (
                  <span key={topic} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-300">
                    {topic} ({count} wrong)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-5 justify-center">
            <button
              onClick={() => router.push("/quizzes/new")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-all"
            >
              <Zap size={14} />
              New quiz
            </button>
            <button
              onClick={() => router.push("/quizzes")}
              className="px-4 py-2 border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white text-sm rounded-lg transition-colors"
            >
              All quizzes
            </button>
          </div>
        </div>

        {/* Question review */}
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Review</h2>
        <div className="space-y-4">
          {quiz.questions.map((q, i) => {
            const graded = results.gradedAnswers.find((a) => a.questionId === q.id);
            const isCorrect = graded?.isCorrect;
            return (
              <div
                key={q.id}
                className={cn(
                  "p-4 rounded-xl border",
                  isCorrect
                    ? "border-green-500/15 bg-green-500/5"
                    : "border-red-500/15 bg-red-500/5"
                )}
              >
                <div className="flex items-start gap-2 mb-3">
                  {isCorrect ? (
                    <CheckCircle2 size={15} className="text-green-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
                  )}
                  <p className="text-sm text-white leading-relaxed">
                    <span className="text-zinc-600 mr-1.5">Q{i + 1}.</span>
                    {q.question}
                  </p>
                </div>

                {q.options && q.options.length > 0 && (
                  <div className="space-y-1 mb-3 ml-5">
                    {q.options.map((opt, idx) => {
                      const isUserPick =
                        String(graded?.userAnswer) === String(idx);
                      const isCorrectOpt =
                        String(q.correct_answer) === String(idx);
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-lg",
                            isCorrectOpt
                              ? "bg-green-500/15 text-green-300"
                              : isUserPick && !isCorrectOpt
                              ? "bg-red-500/15 text-red-300"
                              : "text-zinc-600"
                          )}
                        >
                          {isCorrectOpt ? "✓ " : isUserPick ? "✗ " : ""}
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                )}

                {(q.type === "fill_blank" || q.type === "short_answer") && (
                  <div className="ml-5 mb-3 space-y-1">
                    <p className="text-xs text-zinc-500">
                      Your answer:{" "}
                      <span className={isCorrect ? "text-green-400" : "text-red-400"}>
                        {String(graded?.userAnswer ?? "—")}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-zinc-500">
                        Correct:{" "}
                        <span className="text-green-400">
                          {String(q.correct_answer)}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="ml-5 mt-2 p-2.5 bg-black/20 rounded-lg">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    💡 {q.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Quiz-taking screen ────────────────────────────────────────────────────
  const q: QuizQuestion = quiz.questions[current];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-base font-semibold text-white truncate mr-4">
          {quiz.title}
        </h1>
        <div className="flex items-center gap-1.5 text-zinc-500 text-xs shrink-0">
          <Clock size={12} />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {quiz.questions.map((qItem, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={cn(
              "w-7 h-7 rounded-md text-xs font-medium transition-all",
              i === current
                ? "bg-indigo-600 text-white"
                : answers[qItem.id] !== undefined
                ? "bg-indigo-600/20 text-indigo-400"
                : "bg-white/5 text-zinc-600 hover:bg-white/10"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-zinc-500">
            {current + 1} / {quiz.questions.length}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-white/5 text-zinc-500 capitalize">
            {q.type.replace("_", " ")}
          </span>
          <span className={cn(
            "text-[11px] px-2 py-0.5 rounded capitalize",
            q.difficulty === "easy" ? "bg-green-500/10 text-green-400" :
            q.difficulty === "hard" ? "bg-red-500/10 text-red-400" :
            "bg-amber-500/10 text-amber-400"
          )}>
            {q.difficulty}
          </span>
        </div>

        <p className="text-white text-sm leading-relaxed mb-5">{q.question}</p>

        {/* MCQ / True-False / Assertion-Reason */}
        {q.options && q.options.length > 0 && (
          <div className="space-y-2">
            {q.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(q.id, idx)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                  answers[q.id] === idx
                    ? "border-indigo-500/50 bg-indigo-600/15 text-white"
                    : "border-white/5 bg-white/[0.02] text-zinc-400 hover:text-white hover:border-white/15 hover:bg-white/[0.05]"
                )}
              >
                <span className="text-zinc-600 mr-2">
                  {String.fromCharCode(65 + idx)}.
                </span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Fill in the blank / Short answer */}
        {(q.type === "fill_blank" || q.type === "short_answer") && (
          <input
            type="text"
            placeholder={
              q.type === "fill_blank" ? "Type the missing word..." : "Type your answer..."
            }
            value={String(answers[q.id] ?? "")}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={15} />
          Previous
        </button>

        <span className="text-xs text-zinc-600">
          {answeredCount}/{quiz.questions.length} answered
        </span>

        {current < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Next
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-all"
          >
            {submitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Submit
          </button>
        )}
      </div>
    </div>
  );
}