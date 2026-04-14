"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Zap, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Document } from "@/types/database";

const TYPES = [
  { id: "mcq",              label: "Multiple choice",   desc: "4 options, one correct",   emoji: "🔤" },
  { id: "true_false",       label: "True / False",      desc: "Classic true or false",    emoji: "✅" },
  { id: "fill_blank",       label: "Fill in the blank", desc: "Complete the sentence",    emoji: "✏️" },
  { id: "short_answer",     label: "Short answer",      desc: "Brief text response",      emoji: "💬" },
  { id: "assertion_reason", label: "Assertion–Reason",  desc: "GATE/JEE style",           emoji: "🎯" },
];

const DIFFS = [
  { id: "easy",  label: "Easy",  color: '#4ade80', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.3)' },
  { id: "medium",label: "Medium",color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' },
  { id: "hard",  label: "Hard",  color: '#f87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.3)' },
  { id: "mixed", label: "Mixed", color: '#a5b4fc', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)' },
];

/** Renders the quiz-creation form with document selection, question types, difficulty, and count, then calls the generate API. */
export default function NewQuizPage() {
  const router = useRouter();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [types, setTypes] = useState<string[]>(["mcq"]);
  const [diff, setDiff] = useState("mixed");
  const [count, setCount] = useState(5);

  useEffect(() => {
    createClient().from("documents").select("*").eq("status", "ready").order("created_at", { ascending: false })
      .then(({ data }) => { setDocs(data ?? []); if (data?.[0]) setSelectedDoc(data[0].id); setLoadingDocs(false); });
  }, []);

  /** Toggles a question type on or off, ensuring at least one type stays selected. */
  function toggle(id: string) {
    setTypes(p => p.includes(id) ? (p.length > 1 ? p.filter(t => t !== id) : p) : [...p, id]);
  }

  /** Sends the quiz configuration to the generate API and navigates to the newly created quiz on success. */
  async function generate() {
    if (!selectedDoc) { toast.error("Select a document first"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: selectedDoc, questionTypes: types, difficulty: diff, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`${data.questions} questions ready!`);
      router.push(`/quizzes/${data.quizId}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="p-7 max-w-xl animate-fade-up">
      <div className="mb-7">
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)', marginBottom: 6 }}>New quiz</h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Generate an adaptive quiz from your notes</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Document</label>
          {loadingDocs ? (
            <div style={{ height: 42, background: 'rgba(255,255,255,0.04)', borderRadius: 10, animation: 'pulse 2s infinite' }} />
          ) : docs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-3)', padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 10 }}>No ready documents. Upload one first.</p>
          ) : (
            <div style={{ position: 'relative' }}>
              <select value={selectedDoc} onChange={e => setSelectedDoc(e.target.value)} className="input-base" style={{ paddingRight: 36, appearance: 'none', cursor: 'pointer' }}>
                {docs.map(d => <option key={d.id} value={d.id} style={{ background: '#0f0f1a' }}>{d.title}</option>)}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Question types</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {TYPES.map(t => {
              const on = types.includes(t.id);
              return (
                <button key={t.id} type="button" onClick={() => toggle(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, border: `1px solid ${on ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                  background: on ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: 18 }}>{t.emoji}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: on ? '#a5b4fc' : 'var(--text-2)', margin: 0 }}>{t.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Difficulty</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            {DIFFS.map(d => (
              <button key={d.id} type="button" onClick={() => setDiff(d.id)} style={{
                padding: '10px 4px', borderRadius: 10, border: `1px solid ${diff === d.id ? d.border : 'var(--border)'}`,
                background: diff === d.id ? d.bg : 'rgba(255,255,255,0.02)',
                color: diff === d.id ? d.color : 'var(--text-3)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
              }}>{d.label}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>
            Questions — <span style={{ color: '#818cf8' }}>{count}</span>
          </label>
          <input type="range" min={3} max={15} step={1} value={count} onChange={e => setCount(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#6366f1', height: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            <span>3 — quick test</span><span>15 — full exam</span>
          </div>
        </div>

        <button onClick={generate} disabled={loading || docs.length === 0} className="btn-primary" style={{ padding: '13px', fontSize: 15 }}>
          {loading ? <><Loader2 size={16} className="animate-spin" />Generating...</> : <><Zap size={16} />Generate quiz</>}
        </button>
        {loading && <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-3)', marginTop: -12 }}>AI is reading your notes and writing questions (~15s)</p>}
      </div>
    </div>
  );
}