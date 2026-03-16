"use client";
import { useEffect, useState, useRef } from "react";
import { Sparkles, TrendingUp, Zap, AlertTriangle, Award, Activity, BarChart2, PieChart } from "lucide-react";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(() => import("@/components/charts/ChartRenderer"), { ssr: false });

interface QueryResult {
  chart_type: string;
  chart_data: unknown;
  table_data: Record<string, unknown>[] | null;
  insights: string;
  row_count: number;
  execution_time_ms: number;
  history_id: number;
}

interface KPI {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
}

function useCountUp(target: number, duration = 1500) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return val;
}

function AnimatedKPI({ kpi, delay }: { kpi: KPI; delay: number }) {
  const [visible, setVisible] = useState(false);
  const numericVal = parseFloat(kpi.value.replace(/[^0-9.]/g, "")) || 0;
  const counted = useCountUp(visible ? numericVal : 0);
  const prefix = kpi.value.startsWith("₹") ? "₹" : "";
  const suffix = kpi.value.includes("%") ? "%" : kpi.value.includes("x") ? "x" : "";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1.5px solid var(--border-subtle)",
      borderRadius: 20, padding: "22px 24px",
      boxShadow: "var(--shadow-card)",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background glow */}
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 100, height: 100, borderRadius: "50%",
        background: kpi.gradient, opacity: 0.08, filter: "blur(20px)",
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: kpi.gradient,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 14px ${kpi.color}40`,
        }}>
          <kpi.icon style={{ width: 20, height: 20, color: "white" }} />
        </div>
        <span style={{
          fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: kpi.color,
          background: `${kpi.color}18`, padding: "3px 10px", borderRadius: 99,
          border: `1px solid ${kpi.color}30`,
        }}>LIVE</span>
      </div>
      <div style={{
        fontFamily: "'Clash Display', sans-serif",
        fontSize: "2rem", fontWeight: 800,
        color: "var(--text-primary)", lineHeight: 1, marginBottom: 4,
      }}>
        {prefix}{counted.toLocaleString("en-IN")}{suffix}
      </div>
      <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 2 }}>{kpi.label}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{kpi.sub}</div>
    </div>
  );
}

const CAROUSEL_QUERIES = [
  { question: "Show top campaign types by total revenue as bar chart", title: "Revenue by Campaign", icon: BarChart2 },
  { question: "Compare average ROI by channel used as bar chart", title: "ROI by Channel", icon: TrendingUp },
  { question: "Donut chart of total revenue by campaign type", title: "Revenue Split", icon: PieChart },
  { question: "Compare conversions by language as bar chart", title: "Conversions by Language", icon: Activity },
];

const HEATMAP_CHANNELS = ["YouTube", "Instagram", "Facebook", "Google", "WhatsApp", "Twitter"];
const HEATMAP_TYPES    = ["Social Media", "Paid Ads", "Influencer", "Email"];

export default function InsightsPage() {
  const [kpis, setKpis]           = useState<KPI[]>([]);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [carousel, setCarousel]   = useState<(QueryResult | null)[]>([null, null, null, null]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [heatmap, setHeatmap]     = useState<number[][]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(true);
  const [alerts, setAlerts]       = useState<{ type: "top" | "warn"; text: string }[]>([]);
  const [summary, setSummary]     = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);
  const carouselTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-rotate carousel
  useEffect(() => {
    carouselTimer.current = setInterval(() => {
      setActiveSlide(s => (s + 1) % CAROUSEL_QUERIES.length);
    }, 5000);
    return () => { if (carouselTimer.current) clearInterval(carouselTimer.current); };
  }, []);

  // Load KPIs
useEffect(() => {
  async function loadKPIs() {
    try {
      const totalRevRes  = await api.post("/api/chat/query", { question: "Total revenue across all campaigns" });
      await new Promise(r => setTimeout(r, 300));
      const avgRoiRes    = await api.post("/api/chat/query", { question: "Average ROI across all campaigns" });
      await new Promise(r => setTimeout(r, 300));
      const totalConvRes = await api.post("/api/chat/query", { question: "Total conversions across all campaigns" });
      await new Promise(r => setTimeout(r, 300));
      const avgCostRes   = await api.post("/api/chat/query", { question: "Average acquisition cost across all campaigns" });

      const getVal = (res: { data: QueryResult }) => {
        const td = res.data.table_data;
        if (!td || !td.length) return 0;
        const keys = Object.keys(td[0]);
        const numKey = keys.find(k => !isNaN(Number(td[0][k]))) || keys[0];
        return parseFloat(String(td[0][numKey] ?? 0));
      };

      const totalRev  = getVal(totalRevRes);
      const avgRoi    = getVal(avgRoiRes);
      const totalConv = getVal(totalConvRes);
      const avgCost   = getVal(avgCostRes);

      setKpis([
        { label: "Total Revenue",        value: `₹${Math.round(totalRev).toLocaleString("en-IN")}`,  sub: "Across all campaigns",    icon: TrendingUp, color: "#9D0039", gradient: "linear-gradient(135deg, #9D0039, #C4004A)" },
        { label: "Average ROI",          value: `${avgRoi.toFixed(1)}x`,                              sub: "Return on investment",     icon: Zap,        color: "#E8005A", gradient: "linear-gradient(135deg, #E8005A, #FF4D8F)" },
        { label: "Total Conversions",    value: `${Math.round(totalConv).toLocaleString("en-IN")}`,   sub: "Successful conversions",   icon: Award,      color: "#9D0039", gradient: "linear-gradient(135deg, #6B0027, #9D0039)" },
        { label: "Avg Acquisition Cost", value: `₹${Math.round(avgCost).toLocaleString("en-IN")}`,   sub: "Cost per customer",        icon: Activity,   color: "#C4004A", gradient: "linear-gradient(135deg, #C4004A, #E8005A)" },
      ]);

      const newAlerts: { type: "top" | "warn"; text: string }[] = [];
      if (avgRoi > 3)      newAlerts.push({ type: "top",  text: `🔥 Exceptional avg ROI of ${avgRoi.toFixed(1)}x — campaigns are highly profitable` });
      if (avgCost > 500)   newAlerts.push({ type: "warn", text: `⚠️ High acquisition cost ₹${Math.round(avgCost)} — consider optimizing targeting` });
      if (totalConv > 1000) newAlerts.push({ type: "top", text: `🏆 ${Math.round(totalConv).toLocaleString("en-IN")} total conversions — strong overall performance` });
      setAlerts(newAlerts);

    } catch (e) {
      console.error("KPI load error:", e);
    } finally {
      setKpiLoading(false);
    }
  }
  loadKPIs();
}, []);

  // Load carousel charts
  useEffect(() => {
    async function loadCarousel() {
      for (let i = 0; i < CAROUSEL_QUERIES.length; i++) {
        try {
          const res = await api.post("/api/chat/query", { question: CAROUSEL_QUERIES[i].question });
          setCarousel(prev => { const n = [...prev]; n[i] = res.data; return n; });
        } catch { /* ignore */ }
        await new Promise(r => setTimeout(r, 300));
      }
    }
    loadCarousel();
  }, []);

  // Load heatmap
  useEffect(() => {
    async function loadHeatmap() {
      try {
        const res = await api.post("/api/chat/query", {
          question: "Show total revenue grouped by channel_used and campaign_type as table",
        });
        const td: Record<string, unknown>[] = res.data.table_data || [];
        const matrix = HEATMAP_TYPES.map(type =>
          HEATMAP_CHANNELS.map(ch => {
            const row = td.find(r =>
              String(r.channel_used ?? r[Object.keys(r)[0]]).toLowerCase().includes(ch.toLowerCase()) &&
              String(r.campaign_type ?? r[Object.keys(r)[1]]).toLowerCase().includes(type.toLowerCase().split(" ")[0])
            );
            if (!row) return 0;
            const keys = Object.keys(row);
            const numKey = keys.find(k => !isNaN(Number(row[k])) && Number(row[k]) > 1) || keys[keys.length - 1];
            return parseFloat(String(row[numKey] ?? 0));
          })
        );
        setHeatmap(matrix);
      } catch { /* ignore */ }
      finally { setHeatmapLoading(false); }
    }
    loadHeatmap();
  }, []);

  // Load AI summary
  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.post("/api/chat/query", {
          question: "Give overall performance summary of all campaigns",
        });
        const ins: string = res.data.insights || "";
        const first = ins.split("\n").find(l => l.trim()) || "";
        setSummary(first.replace(/^[-•]\s*/, "").replace(/\*\*/g, ""));
      } catch { /* ignore */ }
      finally { setSummaryLoading(false); }
    }
    loadSummary();
  }, []);

  // Heatmap color
  const heatColor = (val: number, max: number) => {
    if (!val || !max) return "rgba(157,0,57,0.06)";
    const intensity = val / max;
    return `rgba(157,0,57,${0.1 + intensity * 0.85})`;
  };
  const heatMax = heatmap.length ? Math.max(...heatmap.flat()) : 1;

  const activeData = carousel[activeSlide];

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
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
              Intelligence Command Center
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: -1 }}>
              Live analytics · Auto-refreshing
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block", boxShadow: "0 0 8px #10b981" }} />
          <span style={{ fontSize: "0.875rem", color: "#10b981", fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

          {/* AI Summary Banner */}
          <div style={{
            padding: "16px 22px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(157,0,57,0.10), rgba(232,0,90,0.06))",
            border: "1.5px solid rgba(157,0,57,0.25)",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #9D0039, #E8005A)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles style={{ width: 16, height: 16, color: "white" }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9D0039" }}>
                AI Executive Summary
              </span>
              {summaryLoading ? (
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {[0,1,2].map(i => (
                    <span key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#9D0039", opacity: 0.4, display: "inline-block", animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "1rem", color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500, lineHeight: 1.5 }}>
                  {summary || "Nykaa campaigns are performing across multiple channels with strong revenue and ROI metrics."}
                </p>
              )}
            </div>
          </div>

          {/* Smart Alerts */}
          {alerts.length > 0 && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {alerts.map((alert, i) => (
                <div key={i} style={{
                  padding: "10px 18px", borderRadius: 12, flex: 1, minWidth: 240,
                  background: alert.type === "top" ? "rgba(4,120,87,0.08)" : "rgba(217,119,6,0.08)",
                  border: `1.5px solid ${alert.type === "top" ? "rgba(4,120,87,0.25)" : "rgba(217,119,6,0.25)"}`,
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  {alert.type === "top"
                    ? <Award style={{ width: 16, height: 16, color: "#047857", flexShrink: 0 }} />
                    : <AlertTriangle style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0 }} />}
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 500 }}>{alert.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* KPI Cards */}
          {kpiLoading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ height: 140, borderRadius: 20, background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {kpis.map((kpi, i) => <AnimatedKPI key={i} kpi={kpi} delay={i * 150} />)}
            </div>
          )}

          {/* Carousel + Heatmap row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Auto-rotating Chart Carousel */}
            <div style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
              borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-card)",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BarChart2 style={{ width: 17, height: 17, color: "#9D0039" }} />
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {CAROUSEL_QUERIES[activeSlide].title}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {CAROUSEL_QUERIES.map((q, i) => (
                    <button key={i} onClick={() => {
                      setActiveSlide(i);
                      if (carouselTimer.current) clearInterval(carouselTimer.current);
                      carouselTimer.current = setInterval(() => setActiveSlide(s => (s + 1) % CAROUSEL_QUERIES.length), 5000);
                    }} style={{
                      width: i === activeSlide ? 20 : 8, height: 8, borderRadius: 99,
                      background: i === activeSlide ? "#9D0039" : "rgba(157,0,57,0.25)",
                      border: "none", cursor: "pointer", padding: 0,
                      transition: "all 0.3s ease",
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {activeData ? (
                  <ChartRenderer
                    chartType={activeData.chart_type}
                    chartData={activeData.chart_data as never}
                    tableData={activeData.table_data}
                    historyId={activeData.history_id}
                  />
                ) : (
                  <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#9D0039", opacity: 0.4, display: "inline-block", animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Slide tabs */}
              <div style={{ display: "flex", borderTop: "1px solid var(--border-subtle)" }}>
                {CAROUSEL_QUERIES.map((q, i) => (
                  <button key={i} onClick={() => setActiveSlide(i)} style={{
                    flex: 1, padding: "10px 8px", border: "none", cursor: "pointer",
                    background: i === activeSlide ? "rgba(157,0,57,0.08)" : "transparent",
                    borderTop: i === activeSlide ? "2px solid #9D0039" : "2px solid transparent",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.2s",
                  }}>
                    <q.icon style={{ width: 14, height: 14, color: i === activeSlide ? "#9D0039" : "var(--text-muted)" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: i === activeSlide ? 700 : 500, color: i === activeSlide ? "#9D0039" : "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {q.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Heatmap */}
            <div style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
              borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-card)",
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 10 }}>
                <Activity style={{ width: 17, height: 17, color: "#9D0039" }} />
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
                  Revenue Heatmap
                </span>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginLeft: "auto" }}>Channel × Campaign Type</span>
              </div>
              <div style={{ padding: "16px 20px" }}>
                {heatmapLoading ? (
                  <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "#9D0039", opacity: 0.4, display: "inline-block", animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3 }}>
                      <thead>
                        <tr>
                          <th style={{ fontSize: "0.72rem", color: "var(--text-muted)", padding: "4px 6px", textAlign: "left", fontWeight: 600 }}>
                            Campaign ↓ / Channel →
                          </th>
                          {HEATMAP_CHANNELS.map(ch => (
                            <th key={ch} style={{ fontSize: "0.7rem", color: "var(--text-muted)", padding: "4px 4px", textAlign: "center", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {ch}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {HEATMAP_TYPES.map((type, ti) => (
                          <tr key={type}>
                            <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "4px 6px", fontWeight: 600, whiteSpace: "nowrap" }}>
                              {type}
                            </td>
                            {HEATMAP_CHANNELS.map((ch, ci) => {
                              const val = heatmap[ti]?.[ci] ?? 0;
                              return (
                                <td key={ch} title={`${type} × ${ch}: ₹${Math.round(val).toLocaleString("en-IN")}`} style={{
                                  width: 52, height: 40, textAlign: "center",
                                  background: heatColor(val, heatMax),
                                  borderRadius: 8, cursor: "default",
                                  fontSize: "0.68rem", color: val > heatMax * 0.5 ? "white" : "var(--text-secondary)",
                                  fontWeight: 700, transition: "transform 0.15s",
                                  padding: "2px",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.15)")}
                                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}>
                                  {val > 0 ? `₹${(val/1000).toFixed(0)}k` : "—"}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {/* Legend */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Low</span>
                      {[0.1, 0.3, 0.5, 0.7, 0.9].map(op => (
                        <div key={op} style={{ width: 20, height: 14, borderRadius: 4, background: `rgba(157,0,57,${op})` }} />
                      ))}
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>High</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}