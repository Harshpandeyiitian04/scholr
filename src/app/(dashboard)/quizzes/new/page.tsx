"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap, FileText, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/database";

const QUESTION_TYPES = [
  { id: "mcq", label: "Multiple choice", desc: "4 options, one correct" },
  { id: "true_false", label: "True / False", desc: "Classic true or false" },
  { id: "fill_blank", label: "Fill in the blank", desc: "Complete the sentence" },
  { id: "short_answer", label: "Short answer", desc: "Brief text response" },
  {
    id: "assertion_reason",
    label: "Assertion–Reason",
    desc: "GATE/JEE style",
  },
];

const DIFFICULTIES = [
  { id: "easy", label: "Easy", color: "text-green-400 border-green-500/30 bg-green-500/5" },
  { id: "medium", label: "Medium", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
  { id: "hard", label: "Hard", color: "text-red-400 border-red-500/30 bg-red-500/5" },
  { id: "mixed", label: "Mixed", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/5" },
];

/** Renders the quiz-creation form where users pick a document, question types, difficulty, and count before generating a quiz. */
export default function NewQuizPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);

  const [selectedDoc, setSelectedDoc] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(["mcq"]);
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(5);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("documents")
      .select("*")
      .eq("status", "ready")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setDocs(data ?? []);
        if (data?.[0]) setSelectedDoc(data[0].id);
        setLoadingDocs(false);
      });
  }, []);

  /** Toggles a question type on or off, keeping at least one type selected at all times. */
  function toggleType(id: string) {
    setSelectedTypes((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((t) => t !== id)
          : prev
        : [...prev, id]
    );
  }

  /** Calls the quiz-generation API with the selected options and navigates to the new quiz on success. */
  async function handleGenerate() {
    if (!selectedDoc) {
      toast.error("Select a document first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: selectedDoc,
          questionTypes: selectedTypes,
          difficulty,
          count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      toast.success(`Quiz ready! ${data.questions} questions generated.`);
      router.push(`/quizzes/${data.quizId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">New quiz</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Generate an adaptive quiz from your notes
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Document
          </label>
          {loadingDocs ? (
            <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          ) : docs.length === 0 ? (
            <p className="text-sm text-zinc-500 p-3 border border-white/10 rounded-lg">
              No ready documents. Upload one first.
            </p>
          ) : (
            <div className="relative">
              <select
                value={selectedDoc}
                onChange={(e) => setSelectedDoc(e.target.value)}
                className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-9 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all"
              >
                {docs.map((d) => (
                  <option key={d.id} value={d.id} className="bg-[#1a1a1a]">
                    {d.title}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Question types{" "}
            <span className="text-zinc-600 font-normal">(select multiple)</span>
          </label>
          <div className="grid grid-cols-1 gap-2">
            {QUESTION_TYPES.map((t) => {
              const active = selectedTypes.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleType(t.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                    active
                      ? "border-indigo-500/40 bg-indigo-600/10"
                      : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                  )}
                >
                  <div
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
                      active
                        ? "bg-indigo-600 border-indigo-500"
                        : "border-white/20"
                    )}
                  >
                    {active && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        active ? "text-white" : "text-zinc-400"
                      )}
                    >
                      {t.label}
                    </p>
                    <p className="text-xs text-zinc-600">{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Difficulty
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDifficulty(d.id)}
                className={cn(
                  "py-2 rounded-lg border text-sm font-medium transition-all",
                  difficulty === d.id
                    ? d.color
                    : "border-white/5 text-zinc-600 hover:text-zinc-400 hover:border-white/10"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Number of questions —{" "}
            <span className="text-indigo-400 font-semibold">{count}</span>
          </label>
          <input
            type="range"
            min={3}
            max={15}
            step={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-zinc-600 mt-1">
            <span>3 (quick)</span>
            <span>15 (full exam)</span>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || docs.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating quiz...
            </>
          ) : (
            <>
              <Zap size={16} />
              Generate quiz
            </>
          )}
        </button>

        {loading && (
          <p className="text-center text-xs text-zinc-600">
            AI is reading your notes and writing questions... (~15 seconds)
          </p>
        )}
      </div>
    </div>
  );
}