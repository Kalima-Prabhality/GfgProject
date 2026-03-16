"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Clock, BarChart2, Code2, Sparkles, ChevronDown } from "lucide-react";
import { historyApi } from "@/lib/api";
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(() => import("@/components/charts/ChartRenderer"), { ssr: false });

interface HistoryDetail {
  id: number;
  question: string;
  generated_sql: string;
  chart_type: string;
  insights: string;
  timestamp: string;
  result_json?: string;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function HistoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [item, setItem]       = useState<HistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSql, setShowSql] = useState(false);
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    historyApi.get(Number(params.id))
      .then(r => setItem(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(157,0,57,0.2)", borderTopColor: "#9D0039", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: "1rem", color: "var(--text-muted)" }}>Loading analysis...</p>
      </div>
    </div>
  );

  if (!item) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.125rem", color: "var(--text-secondary)" }}>Analysis not found</p>
        <button onClick={() => router.back()} style={{ marginTop: 16, color: "var(--brand)", cursor: "pointer", background: "none", border: "none", fontSize: "1rem" }}>
          ← Go back
        </button>
      </div>
    </div>
  );

  // Parse saved data
  let tableData: Record<string, unknown>[] | null = null;
  let chartData: unknown = null;
  try {
    if (item.result_json) {
      tableData = JSON.parse(item.result_json);
    }
  } catch { /* ignore */ }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* Header */}
      <div className="flex-shrink-0 glass flex items-center gap-4 px-6"
        style={{ height: 64, borderBottom: "1px solid var(--border-subtle)" }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "var(--bg-elevated)", border: "1.5px solid var(--border-default)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-muted)",
        }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.0625rem", fontWeight: 700,
            color: "var(--text-primary)", lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{item.question}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              <Clock style={{ width: 13, height: 13 }} />{timeAgo(item.timestamp)}
            </span>
            <span style={{
              padding: "2px 10px", borderRadius: 99,
              background: "var(--brand-dim)", color: "var(--brand)",
              border: "1.5px solid var(--brand-border)",
              fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
            }}>{item.chart_type}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Chart */}
          {tableData && tableData.length > 0 && (
            <div style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
              borderRadius: 20, padding: "24px 24px 18px",
              boxShadow: "var(--shadow-card)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <BarChart2 style={{ width: 18, height: 18, color: "var(--brand)" }} />
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)",
                }}>Chart</span>
              </div>
              <ChartRenderer
                chartType={item.chart_type}
                chartData={chartData as never}
                tableData={tableData}
                historyId={item.id}
              />
            </div>
          )}

          {/* Insights */}
          {item.insights && (
            <div style={{
              background: "linear-gradient(135deg, rgba(157,0,57,0.08), rgba(232,0,90,0.04))",
              border: "1.5px solid rgba(157,0,57,0.22)",
              borderRadius: 18, padding: "20px 22px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 9,
                  background: "linear-gradient(135deg, #9D0039, #E8005A)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles style={{ width: 15, height: 15, color: "white" }} />
                </div>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.0625rem", fontWeight: 700, color: "#9D0039",
                }}>AI Insights</span>
              </div>
              {item.insights.split("\n").filter(l => l.trim()).map((line, i) => {
                const clean = line.replace(/^[-•]\s*/, "");
                const parts = clean.split(/\*\*(.+?)\*\*/g);
                return (
                  <p key={i} style={{ fontSize: "1rem", color: "var(--text-secondary)", lineHeight: 1.7, margin: "6px 0", display: "flex", gap: 10 }}>
                    <span style={{ color: "#9D0039", flexShrink: 0, fontWeight: 700 }}>•</span>
                    <span>{parts.map((pt, j) => j % 2 === 1
                      ? <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{pt}</strong>
                      : pt)}</span>
                  </p>
                );
              })}
            </div>
          )}

          {/* SQL */}
          {item.generated_sql && (
            <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid var(--border-subtle)" }}>
              <button onClick={() => setShowSql(!showSql)} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px", background: "var(--bg-elevated)",
                border: "none", cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Code2 style={{ width: 16, height: 16, color: "var(--brand)" }} />
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Generated SQL
                  </span>
                  <span style={{ padding: "2px 8px", borderRadius: 99, background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand-border)", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                    SELECT ONLY
                  </span>
                </div>
                <ChevronDown style={{ width: 16, height: 16, color: "var(--text-muted)", transform: showSql ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {showSql && (
                <div style={{ position: "relative" }}>
                  <pre style={{
                    margin: 0, padding: "16px 20px",
                    background: "var(--bg-card)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.9rem", lineHeight: 1.7,
                    color: "var(--brand)", overflowX: "auto",
                    borderTop: "1px solid var(--border-subtle)",
                  }}>{item.generated_sql}</pre>
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(item.generated_sql); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{
                      position: "absolute", top: 12, right: 14,
                      padding: "5px 14px", borderRadius: 8,
                      background: "var(--bg-elevated)", border: "1px solid var(--border-default)",
                      fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                      color: copied ? "var(--emerald)" : "var(--text-muted)",
                    }}>
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}