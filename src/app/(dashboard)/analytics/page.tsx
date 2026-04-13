"use client";

import { useState, useEffect } from "react";
import {
  BarChart2,
  Zap,
  FileText,
  MessageSquare,
  Flame,
  Clock,
  TrendingUp,
  Target,
  Loader2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  overview: {
    documents: number;
    quizzes: number;
    attempts: number;
    avgScore: number;
    bestScore: number;
    streak: number;
    totalMinutes: number;
    chatMessages: number;
    queriesUsed: number;
  };
  scoreHistory: { date: string; score: number; raw: string }[];
  weakTopics: { topic: string; wrong: number; total: number; errorRate: number }[];
  difficultyStats: {
    difficulty: string;
    correct: number;
    total: number;
    rate: number | null;
  }[];
  activityData: { date: string; count: number; day: string }[];
  recentDocs: { id: string; title: string; status: string; created_at: string }[];
}

function StatCard({ icon: Icon, label, value, sub, color = "var(--text-1)" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
        <Icon size={14} style={{ color: 'var(--text-3)' }} />
      </div>
      <p style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

// Mini bar chart using pure CSS/div
function ScoreChart({ data }: { data: { date: string; score: number; raw: string }[] }) {
  if (data.length === 0) return (
    <div className="h-32 flex items-center justify-center text-zinc-600 text-sm">
      No quiz attempts yet
    </div>
  );

  const max = 100;
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {d.raw} · {d.score}%
            <div className="text-zinc-500">{d.date}</div>
          </div>
          <div
            className={cn(
              "w-full rounded-t-sm transition-all",
              d.score >= 80
                ? "bg-green-500/60 group-hover:bg-green-500/80"
                : d.score >= 60
                ? "bg-amber-500/60 group-hover:bg-amber-500/80"
                : "bg-red-500/60 group-hover:bg-red-500/80"
            )}
            style={{ height: `${(d.score / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// Activity heatmap — last 30 days as a row of squares
function ActivityHeatmap({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex gap-1 flex-wrap">
      {data.map((d, i) => {
        const intensity = d.count === 0 ? 0 : Math.ceil((d.count / max) * 4);
        return (
          <div
            key={i}
            title={`${d.date}: ${d.count} activities`}
            className={cn(
              "w-5 h-5 rounded-sm transition-all",
              intensity === 0 && "bg-white/[0.04]",
              intensity === 1 && "bg-indigo-900/60",
              intensity === 2 && "bg-indigo-700/70",
              intensity === 3 && "bg-indigo-500/80",
              intensity === 4 && "bg-indigo-400"
            )}
          />
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-3 text-zinc-500">
        <Loader2 size={16} className="animate-spin" />
        Loading analytics...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-red-400 text-sm">{error || "Something went wrong"}</div>
    );
  }

  const { overview, scoreHistory, weakTopics, difficultyStats, activityData } = data;

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-500",
    medium: "bg-amber-500",
    hard: "bg-red-500",
  };

  return (
    <div className="p-7 max-w-5xl animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Your study performance at a glance
        </p>
      </div>

      {/* Streak banner */}
      {overview.streak > 0 && (
        <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6">
          <Flame size={20} className="text-orange-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">
              {overview.streak} day study streak 🔥
            </p>
            <p className="text-xs text-zinc-500">
              Keep it up — consistency beats intensity
            </p>
          </div>
        </div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={FileText}
          label="Documents"
          value={overview.documents}
        />
        <StatCard
          icon={Zap}
          label="Quizzes taken"
          value={overview.attempts}
          sub={`${overview.quizzes} generated`}
        />
        <StatCard
          icon={Target}
          label="Avg score"
          value={overview.attempts > 0 ? `${overview.avgScore}%` : "—"}
          color={
            overview.avgScore >= 80
              ? "#4ade80"
              : overview.avgScore >= 60
              ? "#fbbf24"
              : "#f87171"
          }
        />
        <StatCard
          icon={Trophy}
          label="Best score"
          value={overview.attempts > 0 ? `${overview.bestScore}%` : "—"}
          color="#818cf8"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={Flame}
          label="Study streak"
          value={`${overview.streak}d`}
          color="#fb923c"
        />
        <StatCard
          icon={Clock}
          label="Study time"
          value={
            overview.totalMinutes >= 60
              ? `${Math.floor(overview.totalMinutes / 60)}h ${overview.totalMinutes % 60}m`
              : `${overview.totalMinutes}m`
          }
        />
        <StatCard
          icon={MessageSquare}
          label="Chat messages"
          value={overview.chatMessages}
        />
        <StatCard
          icon={BarChart2}
          label="AI queries"
          value={overview.queriesUsed}
          sub="used so far"
        />
      </div>

      {/* Score history chart */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-zinc-300">
            Score history
          </h2>
          <span className="text-xs text-zinc-600 ml-1">
            (last {scoreHistory.length} attempts)
          </span>
        </div>
        <ScoreChart data={scoreHistory} />
        {scoreHistory.length > 0 && (
          <div className="flex items-center gap-4 mt-3">
            {[
              { color: "bg-green-500/60", label: "≥ 80%" },
              { color: "bg-amber-500/60", label: "60–79%" },
              { color: "bg-red-500/60", label: "< 60%" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-sm", l.color)} />
                <span className="text-[11px] text-zinc-600">{l.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {/* Difficulty breakdown */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">
            Accuracy by difficulty
          </h2>
          <div className="space-y-3">
            {difficultyStats.map((d) => (
              <div key={d.difficulty}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-400 capitalize">
                    {d.difficulty}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {d.rate !== null
                      ? `${d.rate}% (${d.correct}/${d.total})`
                      : "No data"}
                  </span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      difficultyColors[d.difficulty] ?? "bg-zinc-500"
                    )}
                    style={{ width: `${d.rate ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
            {difficultyStats.every((d) => d.total === 0) && (
              <p className="text-xs text-zinc-600 py-2">
                Take some quizzes to see difficulty breakdown
              </p>
            )}
          </div>
        </div>

        {/* Weak topics */}
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-zinc-300 mb-4">
            Topics to revise
          </h2>
          {weakTopics.length === 0 ? (
            <p className="text-xs text-zinc-600 py-2">
              {overview.attempts === 0
                ? "Take quizzes to identify weak topics"
                : "Great job — no major weak spots!"}
            </p>
          ) : (
            <div className="space-y-2">
              {weakTopics.map((t) => (
                <div key={t.topic} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-400 truncate">
                        {t.topic}
                      </span>
                      <span
                        className={cn(
                          "text-[11px] shrink-0 ml-2",
                          t.errorRate >= 70
                            ? "text-red-400"
                            : t.errorRate >= 40
                            ? "text-amber-400"
                            : "text-zinc-500"
                        )}
                      >
                        {t.errorRate}% wrong
                      </span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          t.errorRate >= 70
                            ? "bg-red-500/70"
                            : t.errorRate >= 40
                            ? "bg-amber-500/70"
                            : "bg-zinc-500/70"
                        )}
                        style={{ width: `${t.errorRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity heatmap */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">
            Activity — last 30 days
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-600">Less</span>
            {["bg-white/[0.04]", "bg-indigo-900/60", "bg-indigo-700/70", "bg-indigo-500/80", "bg-indigo-400"].map((c, i) => (
              <div key={i} className={cn("w-3.5 h-3.5 rounded-sm", c)} />
            ))}
            <span className="text-[11px] text-zinc-600">More</span>
          </div>
        </div>
        <ActivityHeatmap data={activityData} />
        <p className="text-[11px] text-zinc-700 mt-3">
          Counts quizzes attempted + chat messages sent per day
        </p>
      </div>
    </div>
  );
}