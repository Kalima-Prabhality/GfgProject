"use client";
import { useState } from "react";
import { Sparkles, TrendingUp, BarChart2, PieChart, Activity, Zap, RefreshCw, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(() => import("@/components/charts/ChartRenderer"), { ssr: false });

interface InsightResult {
  question: string;
  chart_type: string;
  chart_data: unknown;
  table_data: Record<string, unknown>[] | null;
  insights: string;
  row_count: number;
  execution_time_ms: number;
  history_id: number;
  generated_sql: string;
}

const PRESET_ANALYSES = [
  {
    id: 1,
    icon: TrendingUp,
    title: "Revenue Leaders",
    desc: "Which campaign types generate the most revenue?",
    question: "Show top campaign types by total revenue as bar chart",
    color: "#9D0039",
    gradient: "linear-gradient(135deg, #9D0039, #C4004A)",
  },
  {
    id: 2,
    icon: BarChart2,
    title: "ROI by Channel",
    desc: "Which marketing channels deliver the best ROI?",
    question: "Compare average ROI by channel used as bar chart",
    color: "#E8005A",
    gradient: "linear-gradient(135deg, #E8005A, #FF4D8F)",
  },
  {
    id: 3,
    icon: PieChart,
    title: "Revenue Split",
    desc: "Revenue distribution across all campaign types",
    question: "Donut chart of total revenue by campaign type",
    color: "#9D0039",
    gradient: "linear-gradient(135deg, #9D0039, #E8005A)",
  },
  {
    id: 4,
    icon: Activity,
    title: "Monthly Trend",
    desc: "How has revenue trended over time?",
    question: "Monthly revenue trend as line chart",
    color: "#C4004A",
    gradient: "linear-gradient(135deg, #C4004A, #FF4D8F)",
  },
  {
    id: 5,
    icon: Zap,
    title: "Language Performance",
    desc: "Which language campaigns convert best?",
    question: "Compare conversions by language as bar chart",
    color: "#E8005A",
    gradient: "linear-gradient(135deg, #6B0027, #9D0039)",
  },
  {
    id: 6,
    icon: TrendingUp,
    title: "Audience Insights",
    desc: "Acquisition cost breakdown by target audience",
    question: "Average acquisition cost by target audience as bar chart",
    color: "#9D0039",
    gradient: "linear-gradient(135deg, #E8005A, #C4004A)",
  },
  {
    id: 7,
    icon: BarChart2,
    title: "Top Campaigns",
    desc: "Best performing individual campaigns by revenue",
    question: "Show top 10 campaigns by revenue as bar chart",
    color: "#C4004A",
    gradient: "linear-gradient(135deg, #9D0039, #FF4D8F)",
  },
  {
    id: 8,
    icon: PieChart,
    title: "Segment Revenue",
    desc: "Revenue share across customer segments",
    question: "Revenue by customer segment as pie chart",
    color: "#E8005A",
    gradient: "linear-gradient(135deg, #B8003F, #E8005A)",
  },
];

export default function InsightsPage() {
  const [results, setResults]   = useState<Record<number, InsightResult | "loading" | "error">>({});
  const [runningAll, setRunningAll] = useState(false);

  async function runAnalysis(id: number, question: string) {
    setResults(prev => ({ ...prev, [id]: "loading" }));
    try {
      const res = await api.post("/api/chat/query", { question });
      setResults(prev => ({ ...prev, [id]: res.data }));
    } catch {
      setResults(prev => ({ ...prev, [id]: "error" }));
    }
  }

  async function runAll() {
    setRunningAll(true);
    for (const a of PRESET_ANALYSES) {
      await runAnalysis(a.id, a.question);
      await new Promise(r => setTimeout(r, 400));
    }
    setRunningAll(false);
  }

  const doneCount = Object.values(results).filter(v => v !== "loading" && v !== "error").length;

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* Header */}
      <div className="flex-shrink-0 glass flex items-center justify-between px-6"
        style={{ height: 64, borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(157,0,57,0.35)",
          }}>
            <Sparkles style={{ width: 18, height: 18, color: "white" }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.25rem", fontWeight: 700,
              color: "var(--text-primary)", lineHeight: 1.2,
            }}>AI Insights</h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: -1 }}>
              {doneCount}/{PRESET_ANALYSES.length} analyses complete
            </p>
          </div>
        </div>

        <button
          onClick={runAll}
          disabled={runningAll}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 22px", borderRadius: 11,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            color: "white", border: "none", cursor: runningAll ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", fontWeight: 600,
            boxShadow: "0 4px 16px rgba(157,0,57,0.30)",
            opacity: runningAll ? 0.7 : 1,
            transition: "all 0.15s",
          }}>
          {runningAll
            ? <><RefreshCw style={{ width: 16, height: 16 }} className="animate-spin" /> Running all...</>
            : <><Zap style={{ width: 16, height: 16 }} /> Run All Analyses</>}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>

          {/* Intro */}
          <div style={{
            padding: "20px 24px", borderRadius: 16, marginBottom: 28,
            background: "linear-gradient(135deg, rgba(157,0,57,0.08), rgba(232,0,90,0.05))",
            border: "1.5px solid rgba(157,0,57,0.20)",
          }}>
            <p style={{ fontSize: "1rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>
              Click any analysis card to run it instantly, or hit <strong style={{ color: "var(--brand)" }}>Run All Analyses</strong> to generate charts and insights for all 8 preset queries at once using Gemini AI.
            </p>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {PRESET_ANALYSES.map(a => {
              const res = results[a.id];
              const isLoading = res === "loading";
              const isError   = res === "error";
              const isDone    = res && res !== "loading" && res !== "error";
              const data      = isDone ? (res as InsightResult) : null;

              return (
                <div key={a.id} style={{
                  background: "var(--bg-card)",
                  border: `1.5px solid ${isDone ? "rgba(157,0,57,0.25)" : "var(--border-subtle)"}`,
                  borderRadius: 20,
                  overflow: "hidden",
                  boxShadow: isDone ? "0 4px 20px rgba(157,0,57,0.10)" : "var(--shadow-sm)",
                  transition: "all 0.25s",
                }}>

                  {/* Card header */}
                  <div style={{
                    padding: "18px 20px",
                    borderBottom: "1px solid var(--border-subtle)",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        background: a.gradient,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: `0 4px 12px ${a.color}40`,
                      }}>
                        <a.icon style={{ width: 20, height: 20, color: "white" }} />
                      </div>
                      <div>
                        <p style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "1.0625rem", fontWeight: 700,
                          color: "var(--text-primary)", marginBottom: 2,
                        }}>{a.title}</p>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>{a.desc}</p>
                      </div>
                    </div>

                    {isDone ? (
                      <CheckCircle2 style={{ width: 22, height: 22, color: "#047857", flexShrink: 0 }} />
                    ) : (
                      <button
                        onClick={() => runAnalysis(a.id, a.question)}
                        disabled={isLoading}
                        style={{
                          padding: "8px 18px", borderRadius: 9,
                          background: isLoading ? "var(--bg-elevated)" : a.gradient,
                          color: isLoading ? "var(--text-muted)" : "white",
                          border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.875rem", fontWeight: 600,
                          display: "flex", alignItems: "center", gap: 6,
                          flexShrink: 0,
                          transition: "all 0.15s",
                        }}>
                        {isLoading
                          ? <><RefreshCw style={{ width: 14, height: 14 }} className="animate-spin" />Running...</>
                          : <><Zap style={{ width: 14, height: 14 }} />Run</>}
                      </button>
                    )}
                  </div>

                  {/* Result area */}
                  {isLoading && (
                    <div style={{ padding: "32px 20px", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                        {[0,1,2].map(i => (
                          <span key={i} style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: "#9D0039", display: "inline-block", opacity: 0.4,
                            animation: "typingDot 1.2s ease-in-out infinite",
                            animationDelay: `${i * 0.2}s`,
                          }} />
                        ))}
                      </div>
                      <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Gemini is analysing...</p>
                    </div>
                  )}

                  {isError && (
                    <div style={{ padding: "24px 20px", textAlign: "center" }}>
                      <p style={{ fontSize: "0.9375rem", color: "var(--red)" }}>Failed to load. Click Run to retry.</p>
                    </div>
                  )}

                  {!res && (
                    <div style={{
                      padding: "32px 20px", textAlign: "center",
                      background: "linear-gradient(135deg, rgba(157,0,57,0.03), rgba(232,0,90,0.02))",
                    }}>
                      <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", margin: 0 }}>
                        Click <strong style={{ color: "var(--brand)" }}>Run</strong> to generate this analysis
                      </p>
                    </div>
                  )}

                  {data && (
                    <div style={{ padding: "16px 20px" }}>
                      {/* Chart */}
                      {(data.chart_data || data.table_data) && (
                        <div style={{ marginBottom: 14 }}>
                          <ChartRenderer
                            chartType={data.chart_type}
                            chartData={data.chart_data as never}
                            tableData={data.table_data}
                            historyId={data.history_id}
                          />
                        </div>
                      )}

                      {/* Insights */}
                      {data.insights && (
                        <div style={{
                          padding: "14px 16px", borderRadius: 12,
                          background: "linear-gradient(135deg, rgba(157,0,57,0.08), rgba(232,0,90,0.05))",
                          border: "1.5px solid rgba(157,0,57,0.20)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <Sparkles style={{ width: 15, height: 15, color: "#9D0039" }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9D0039" }}>
                              AI Insights
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                              {data.row_count} rows · {data.execution_time_ms.toFixed(0)}ms
                            </span>
                          </div>
                          {data.insights.split("\n").filter(l => l.trim()).map((line, i) => {
                            const clean = line.replace(/^[-•]\s*/, "");
                            const parts = clean.split(/\*\*(.+?)\*\*/g);
                            return (
                              <p key={i} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: "4px 0", display: "flex", gap: 8 }}>
                                <span style={{ color: "#9D0039", flexShrink: 0 }}>•</span>
                                <span>{parts.map((pt, j) => j % 2 === 1
                                  ? <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{pt}</strong>
                                  : pt)}</span>
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}