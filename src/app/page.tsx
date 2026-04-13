"use client";

import Link from "next/link";
import { Brain, FileText, Zap, BookOpen, BarChart2, MessageSquare, ArrowRight, Sparkles, Shield, Clock } from "lucide-react";

const features = [
  { icon: FileText,      title: "Upload anything",       desc: "PDFs, DOCX, PPT — even scanned files with text trapped inside images." },
  { icon: Brain,         title: "AI summaries",          desc: "Get TL;DRs, chapter breakdowns, and formula sheets in seconds." },
  { icon: Zap,           title: "Adaptive quizzes",      desc: "MCQ, True/False, Assertion-Reason. Gets harder as you improve." },
  { icon: MessageSquare, title: "Chat with notes",       desc: "Ask anything about your uploaded material. Cited answers from your own files." },
  { icon: BookOpen,      title: "Viva simulator",        desc: "AI examiner mode — get grilled on any topic with instant feedback." },
  { icon: BarChart2,     title: "Performance analytics", desc: "Track weak topics, streaks, and improvement over time." },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "hidden" }}>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,8,16,0.85)", backdropFilter: "blur(20px)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99,102,241,0.4)", flexShrink: 0 }}>
              <Brain size={15} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: "var(--text-1)" }}>Scholr</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/login" style={{ color: "var(--text-2)", fontSize: 14, padding: "8px 16px", borderRadius: 8, textDecoration: "none", transition: "color 0.2s" }}>
              Log in
            </Link>
            <Link href="/signup" style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "white",
              fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 10,
              textDecoration: "none", boxShadow: "0 1px 20px rgba(99,102,241,0.3)",
            }}>
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, textAlign: "center", position: "relative", overflow: "hidden" }}>
        {/* Glow */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", fontSize: 12, color: "#a5b4fc", marginBottom: 28 }}>
            <Sparkles size={12} />
            Built for IIT &amp; engineering students · 100% free
          </div>

          {/* Heading — fixed px sizes, no clamp */}
          <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1, color: "var(--text-1)", margin: "0 0 20px" }}>
            Study smarter with{" "}
            <span style={{
              background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #818cf8 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              AI that knows your notes
            </span>
          </h1>

          <p style={{ fontSize: 16, color: "var(--text-2)", lineHeight: 1.7, margin: "0 auto 36px", maxWidth: 480 }}>
            Upload your notes, textbooks, or lab manuals. Scholr reads everything — including scanned images — and becomes your personal AI tutor.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
            <Link href="/signup" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "white",
              fontSize: 15, fontWeight: 700, padding: "13px 28px", borderRadius: 12,
              textDecoration: "none", boxShadow: "0 2px 30px rgba(99,102,241,0.35)",
            }}>
              Start studying free <ArrowRight size={16} />
            </Link>
            <Link href="/login" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "transparent", color: "var(--text-2)",
              fontSize: 15, fontWeight: 500, padding: "13px 24px", borderRadius: 12,
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.1)",
            }}>
              Log in
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {[{ icon: Shield, text: "No credit card" }, { icon: Clock, text: "Ready in 60 seconds" }, { icon: Zap, text: "OCR for scanned PDFs" }].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-3)" }}>
                <Icon size={13} /> {text}
              </div>
            ))}
          </div>
        </div>

        {/* Preview card */}
        <div style={{ maxWidth: 520, margin: "52px auto 0", position: "relative" }}>
          <div style={{ background: "var(--bg-card)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 18, padding: 20, boxShadow: "0 0 60px rgba(99,102,241,0.08), inset 0 1px 0 rgba(255,255,255,0.04)", textAlign: "left" }}>
            {/* Fake window bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(239,68,68,0.6)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(245,158,11,0.6)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(34,197,94,0.6)" }} />
              <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>Scholr — AI Study Platform</span>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Avg score", value: "84%", color: "#4ade80" },
                { label: "Study streak", value: "7 days", color: "#fbbf24" },
                { label: "Quizzes taken", value: "23", color: "#818cf8" },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: "center", padding: "10px 8px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* AI chat bubble */}
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <Brain size={12} color="#a5b4fc" />
                </div>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, margin: 0 }}>
                  Based on your notes, the key concepts are{" "}
                  <strong style={{ color: "var(--text-1)" }}>demand-pull inflation</strong> and{" "}
                  <strong style={{ color: "var(--text-1)" }}>cost-push inflation</strong>. A common exam question would be to distinguish between the two...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "rgba(255,255,255,0.01)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-1)", margin: "0 0 12px" }}>
              Everything for exam season
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-2)", maxWidth: 420, margin: "0 auto" }}>
              From GATE prep to semester exams, Scholr handles the entire study pipeline.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {features.map((f) => (
              <div key={f.title} style={{
                padding: "22px", borderRadius: 18,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                transition: "transform 0.2s, border-color 0.2s",
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--border-md)"; el.style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "var(--border)"; el.style.transform = "translateY(0)"; }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <f.icon size={18} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", margin: "0 0 8px" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", background: "var(--bg-card)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 24, padding: "52px 40px", boxShadow: "0 0 80px rgba(99,102,241,0.07)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent)" }} />
          <div style={{ width: 56, height: 56, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}>
            <Brain size={24} color="white" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.025em", color: "var(--text-1)", margin: "0 0 12px" }}>
            Ready to ace your exams?
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-2)", margin: "0 0 32px", lineHeight: 1.7 }}>
            Join students who are already studying smarter. Free forever.
          </p>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "white",
            fontSize: 15, fontWeight: 700, padding: "13px 32px", borderRadius: 12,
            textDecoration: "none", boxShadow: "0 2px 30px rgba(99,102,241,0.35)",
          }}>
            Create free account <ArrowRight size={16} />
          </Link>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 16 }}>No credit card · No signup fee</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: "linear-gradient(135deg,#6366f1,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={11} color="white" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-2)" }}>Scholr</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Built by a student, for students · IIT Mandi</p>
      </footer>
    </div>
  );
}
