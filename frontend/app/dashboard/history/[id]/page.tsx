"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Clock, BarChart2, Code2, Sparkles, ChevronDown, Copy, Check, TrendingUp } from "lucide-react";
import { historyApi } from "@/lib/api";
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(() => import("@/components/charts/ChartRenderer"), { ssr: false });

function round(n: number, d: number) {
  return Math.round(n * Math.pow(10, d)) / Math.pow(10, d);
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface HistoryDetail {
  id: number;
  question: string;
  generated_sql: string;
  chart_type: string;
  insights: string;
  timestamp: string;
  result_json?: string;
}

const SOLID = ["#9D0039","#C4004A","#E8005A","#FF4D8F","#6B0027","#FF79A8","#B8003F","#F50057","#800029","#FF1744","#D81B60","#F06292"];
const ALPHA = ["rgba(157,0,57,0.85)","rgba(196,0,74,0.85)","rgba(232,0,90,0.85)","rgba(255,77,143,0.85)","rgba(107,0,39,0.85)","rgba(255,121,168,0.85)","rgba(184,0,63,0.85)","rgba(245,0,87,0.85)","rgba(128,0,41,0.85)","rgba(255,23,68,0.85)","rgba(216,27,96,0.85)","rgba(240,98,146,0.85)"];

const CHART_TYPE_META: Record<string, { label: string; color: string; bg: string }> = {
  bar:      { label: "Bar Chart",   color: "#9D0039", bg: "rgba(157,0,57,0.10)" },
  line:     { label: "Line Chart",  color: "#0E7490", bg: "rgba(14,116,144,0.10)" },
  area:     { label: "Area Chart",  color: "#0E7490", bg: "rgba(14,116,144,0.10)" },
  pie:      { label: "Pie Chart",   color: "#E8005A", bg: "rgba(232,0,90,0.10)" },
  doughnut: { label: "Donut Chart", color: "#E8005A", bg: "rgba(232,0,90,0.10)" },
  radar:    { label: "Radar Chart", color: "#047857", bg: "rgba(4,120,87,0.10)" },
  table:    { label: "Data Table",  color: "#B45309", bg: "rgba(180,83,9,0.10)" },
};

function buildChartData(tableData: Record<string, unknown>[], chartType: string) {
  if (!tableData.length || chartType === "table") return null;
  const keys = Object.keys(tableData[0]);
  const xCol = keys.find(k => isNaN(Number(tableData[0][k]))) || keys[0];
  const yCol = keys.find(k => k !== xCol && !isNaN(Number(tableData[0][k]))) || keys[1];
  const labels = tableData.map(r => String(r[xCol] ?? "").slice(0, 32));
  const values = tableData.map(r => { try { return round(parseFloat(String(r[yCol] ?? 0)), 2); } catch { return 0; } });
  const ct = chartType;
  if (ct === "pie" || ct === "doughnut") {
    return { labels, datasets: [{ label: yCol, data: values, backgroundColor: ALPHA.slice(0, values.length), borderColor: SOLID.slice(0, values.length), borderWidth: 2, hoverOffset: 12 }] };
  }
  if (ct === "radar") {
    return { labels: labels.slice(0, 8), datasets: [{ label: yCol, data: values.slice(0, 8), backgroundColor: "rgba(157,0,57,0.15)", borderColor: "#9D0039", borderWidth: 2.5, pointBackgroundColor: "#9D0039", pointBorderColor: "#fff", pointRadius: 5 }] };
  }
  if (ct === "line" || ct === "area") {
    return { labels, datasets: [{ label: yCol, data: values, backgroundColor: "rgba(157,0,57,0.10)", borderColor: "#9D0039", borderWidth: 2.5, fill: ct === "area", tension: 0.4, pointBackgroundColor: "#9D0039", pointBorderColor: "#fff", pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 8 }] };
  }
  return { labels, datasets: [{ label: yCol, data: values, backgroundColor: ALPHA.slice(0, values.length), borderColor: SOLID.slice(0, values.length), borderWidth: 0, borderRadius: 10, borderSkipped: false }] };
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
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(157,0,57,0.15)", borderTopColor: "#9D0039", animation: "spin 0.8s linear infinite" }} />
        <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>Loading analysis...</p>
      </div>
    </div>
  );

  if (!item) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "1.125rem", color: "var(--text-secondary)" }}>Analysis not found</p>
        <button onClick={() => router.back()} style={{ marginTop: 16, color: "var(--brand)", cursor: "pointer", background: "none", border: "none", fontSize: "1rem" }}>← Go back</button>
      </div>
    </div>
  );

  let tableData: Record<string, unknown>[] | null = null;
  try { if (item.result_json) tableData = JSON.parse(item.result_json); } catch { /* ignore */ }

  const chartData = tableData ? buildChartData(tableData, item.chart_type) : null;
  const chartMeta = CHART_TYPE_META[item.chart_type] || CHART_TYPE_META.table;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>

      {/* ── Header ── */}
      <div style={{
        flexShrink: 0, height: 72,
        display: "flex", alignItems: "center", gap: 14,
        padding: "0 24px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--bg-surface)",
        boxShadow: "0 1px 0 var(--border-subtle), 0 4px 16px rgba(157,0,57,0.04)",
      }}>

        {/* Back button */}
        <button onClick={() => router.back()} style={{
          width: 40, height: 40, borderRadius: 11, flexShrink: 0,
          background: "var(--bg-elevated)",
          border: "1.5px solid var(--border-default)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-muted)",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)";
          (e.currentTarget as HTMLElement).style.color = "var(--brand)";
          (e.currentTarget as HTMLElement).style.background = "var(--brand-dim)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
          (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)";
        }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>

        {/* Title + meta */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.125rem", fontWeight: 700,
            color: "var(--text-primary)", lineHeight: 1.3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            margin: "0 0 5px", letterSpacing: "-0.02em",
          }}>{item.question}</p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Clock style={{ width: 12, height: 12, color: "var(--text-muted)" }} />
              <span style={{ fontSize: "0.775rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                {timeAgo(item.timestamp)}
              </span>
            </div>
            <span style={{
              padding: "3px 12px", borderRadius: 99,
              background: chartMeta.bg, color: chartMeta.color,
              border: `1.5px solid ${chartMeta.color}30`,
              fontSize: "0.70rem", fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.08em",
              fontFamily: "'DM Sans', sans-serif",
            }}>{chartMeta.label}</span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Chart Card ── */}
          {(chartData || (tableData && tableData.length > 0)) && (
            <div style={{
              background: "var(--bg-card)",
              border: "1.5px solid var(--border-subtle)",
              borderRadius: 22, overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}>
              {/* Chart card header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 22px 14px",
                borderBottom: "1px solid var(--border-subtle)",
                background: "linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-card) 100%)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${chartMeta.color}20, ${chartMeta.color}10)`,
                    border: `1.5px solid ${chartMeta.color}25`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <BarChart2 style={{ width: 16, height: 16, color: chartMeta.color }} />
                  </div>
                  <div>
                    <p style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1rem", fontWeight: 700,
                      color: "var(--text-primary)", margin: 0, lineHeight: 1.2,
                    }}>{chartMeta.label}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
                      {tableData?.length || 0} data points
                    </p>
                  </div>
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", borderRadius: 99,
                  background: "var(--brand-dim)",
                  border: "1px solid var(--brand-border)",
                }}>
                  <TrendingUp style={{ width: 12, height: 12, color: "var(--brand)" }} />
                  <span style={{ fontSize: "0.70rem", fontWeight: 800, color: "var(--brand)", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>
                    LIVE DATA
                  </span>
                </div>
              </div>

              {/* Chart body */}
              <div style={{ padding: "20px 22px 18px" }}>
                <ChartRenderer
                  chartType={item.chart_type}
                  chartData={chartData as never}
                  tableData={tableData}
                  historyId={item.id}
                />
              </div>
            </div>
          )}

          {/* ── AI Insights Card ── */}
          {item.insights && (
            <div style={{
              borderRadius: 22, overflow: "hidden",
              border: "1.5px solid rgba(157,0,57,0.18)",
              boxShadow: "0 4px 20px rgba(157,0,57,0.08)",
            }}>
              {/* Insights header */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "16px 22px",
                background: "linear-gradient(135deg, rgba(157,0,57,0.10) 0%, rgba(232,0,90,0.05) 100%)",
                borderBottom: "1px solid rgba(157,0,57,0.12)",
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: "linear-gradient(135deg, #9D0039, #E8005A)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 14px rgba(157,0,57,0.35)",
                }}>
                  <Sparkles style={{ width: 18, height: 18, color: "white" }} />
                </div>
                <div>
                  <p style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.0625rem", fontWeight: 700,
                    color: "#9D0039", margin: 0, lineHeight: 1.2,
                  }}>AI Insights</p>
                  <p style={{ fontSize: "0.72rem", color: "rgba(157,0,57,0.60)", margin: 0, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Powered by Groq AI
                  </p>
                </div>
              </div>

              {/* Insights body */}
              <div style={{
                padding: "18px 20px",
                background: "linear-gradient(135deg, rgba(157,0,57,0.04) 0%, rgba(232,0,90,0.02) 100%)",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                {item.insights.split("\n").filter(l => l.trim()).map((line, i) => {
                  const clean = line.replace(/^[-•*]\s*/, "").replace(/^\*\s*-\s*/, "");
                  const parts = clean.split(/\*\*(.+?)\*\*/g);
                  return (
                    <div key={i} style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      padding: "14px 16px", borderRadius: 14,
                      background: "var(--bg-card)",
border: "1px solid rgba(157,0,57,0.20)",
boxShadow: "0 2px 8px rgba(157,0,57,0.08)",
                    }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                        background: "linear-gradient(135deg, #9D0039, #E8005A)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 1,
                        boxShadow: "0 2px 8px rgba(157,0,57,0.25)",
                      }}>
                        <span style={{ color: "white", fontSize: "0.72rem", fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{i + 1}</span>
                      </div>
                      <p style={{
                        fontSize: "0.9375rem", color: "var(--text-primary)",
                        lineHeight: 1.7, margin: 0, flex: 1,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {parts.map((pt, j) => j % 2 === 1
                          ? <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{pt}</strong>
                          : pt)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SQL Card ── */}
          {item.generated_sql && (
            <div style={{
              borderRadius: 18, overflow: "hidden",
              border: "1.5px solid var(--border-subtle)",
              boxShadow: "var(--shadow-sm)",
            }}>
              <button onClick={() => setShowSql(!showSql)} style={{
                width: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "14px 20px",
                background: "var(--bg-elevated)", border: "none", cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 9,
                    background: "var(--brand-dim)", border: "1px solid var(--brand-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Code2 style={{ width: 14, height: 14, color: "var(--brand)" }} />
                  </div>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Generated SQL
                  </span>
                  <span style={{
                    padding: "2px 9px", borderRadius: 99,
                    background: "var(--brand-dim)", color: "var(--brand)",
                    border: "1px solid var(--brand-border)",
                    fontSize: "0.68rem", fontWeight: 800,
                    textTransform: "uppercase", letterSpacing: "0.07em",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>SELECT ONLY</span>
                </div>
                <ChevronDown style={{
                  width: 16, height: 16, color: "var(--text-muted)",
                  transform: showSql ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }} />
              </button>

              {showSql && (
                <div style={{ position: "relative", borderTop: "1px solid var(--border-subtle)" }}>
                  <pre style={{
                    margin: 0, padding: "18px 22px",
                    background: "var(--bg-card)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "0.875rem", lineHeight: 1.8,
                    color: "var(--brand)", overflowX: "auto",
                  }}>{item.generated_sql}</pre>
                  <button
                    onClick={async () => { await navigator.clipboard.writeText(item.generated_sql); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{
                      position: "absolute", top: 12, right: 14,
                      padding: "5px 14px", borderRadius: 8,
                      background: "var(--bg-elevated)",
                      border: `1px solid ${copied ? "var(--emerald)" : "var(--border-default)"}`,
                      fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                      color: copied ? "var(--emerald)" : "var(--text-muted)",
                      display: "flex", alignItems: "center", gap: 5,
                      transition: "all 0.15s",
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                    {copied
                      ? <><Check style={{ width: 12, height: 12 }} />Copied</>
                      : <><Copy style={{ width: 12, height: 12 }} />Copy</>}
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