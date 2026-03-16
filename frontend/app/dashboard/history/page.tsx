"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  History, Trash2, Clock, ChevronRight,
  Loader2, Search, BarChart2, X, TrendingUp,
  PieChart, Activity, Table2, Radio,
} from "lucide-react";
import { historyApi } from "@/lib/api";
import type { HistoryItem } from "@/types";

const CHART_META: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  bar:      { label: "Bar",    color: "#9D0039", bg: "rgba(157,0,57,0.10)",  Icon: BarChart2 },
  line:     { label: "Line",   color: "#0E7490", bg: "rgba(14,116,144,0.10)", Icon: Activity },
  area:     { label: "Area",   color: "#0E7490", bg: "rgba(14,116,144,0.10)", Icon: Activity },
  pie:      { label: "Pie",    color: "#E8005A", bg: "rgba(232,0,90,0.10)",  Icon: PieChart },
  doughnut: { label: "Donut",  color: "#E8005A", bg: "rgba(232,0,90,0.10)",  Icon: PieChart },
  radar:    { label: "Radar",  color: "#047857", bg: "rgba(4,120,87,0.10)",  Icon: Radio },
  table:    { label: "Table",  color: "#B45309", bg: "rgba(180,83,9,0.10)",  Icon: Table2 },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [items,    setItems]    = useState<HistoryItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filter,   setFilter]   = useState<string>("all");

  useEffect(() => {
    historyApi.list()
      .then(r => setItems(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const chartTypes = useMemo(() => {
    const types = [...new Set(items.map(i => i.chart_type).filter(Boolean))];
    return types;
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.question.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || i.chart_type === filter;
      return matchSearch && matchFilter;
    });
  }, [items, search, filter]);

  async function deleteItem(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleting(id);
    try {
      await historyApi.delete(id);
      setItems(p => p.filter(i => i.id !== id));
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 glass flex items-center justify-between px-6"
        style={{ height: 64, borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: "linear-gradient(135deg, var(--brand), var(--accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "var(--shadow-brand)",
          }}>
            <History style={{ width: 18, height: 18, color: "white" }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.25rem", fontWeight: 700,
              color: "var(--text-primary)", lineHeight: 1.2,
            }}>Query History</h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: -2 }}>
              {items.length} saved {items.length === 1 ? "query" : "queries"}
            </p>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex items-center gap-2">
          {chartTypes.slice(0, 3).map(ct => {
            const meta = CHART_META[ct] || CHART_META.table;
            const count = items.filter(i => i.chart_type === ct).length;
            return (
              <span key={ct} className="badge" style={{
                background: meta.bg, color: meta.color,
                border: `1.5px solid ${meta.color}30`, fontSize: "0.78rem",
              }}>
                {meta.label}: {count}
              </span>
            );
          })}
        </div>
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="flex-shrink-0 px-6 py-4"
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="max-w-4xl mx-auto flex gap-3 items-center">

          {/* Search input */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              width: 18, height: 18, color: "var(--text-muted)",
            }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search your queries..."
              className="input-pro"
              style={{ paddingLeft: 44, paddingRight: search ? 40 : 16 }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", padding: 2,
                color: "var(--text-muted)",
              }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>

          {/* Chart type filter pills */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter("all")} style={{
              padding: "8px 16px", borderRadius: 99, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 600,
              background: filter === "all" ? "var(--brand)" : "var(--bg-elevated)",
              color: filter === "all" ? "white" : "var(--text-secondary)",
              border: `1.5px solid ${filter === "all" ? "var(--brand)" : "var(--border-default)"}`,
              transition: "all 0.15s",
            }}>All</button>
            {chartTypes.map(ct => {
              const meta = CHART_META[ct] || CHART_META.table;
              const active = filter === ct;
              return (
                <button key={ct} onClick={() => setFilter(ct)} style={{
                  padding: "8px 16px", borderRadius: 99, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 600,
                  background: active ? meta.color : meta.bg,
                  color: active ? "white" : meta.color,
                  border: `1.5px solid ${meta.color}40`,
                  transition: "all 0.15s",
                }}>{meta.label}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div style={{ maxWidth: "56rem", margin: "0 auto" }}>

          {loading && (
            <div className="space-y-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="shimmer-skeleton" style={{ height: 80, borderRadius: 16 }} />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--text-muted)" }}>
              <div style={{
                width: 72, height: 72, borderRadius: 22, margin: "0 auto 20px",
                background: "var(--brand-dim)", border: "1.5px solid var(--brand-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <History style={{ width: 32, height: 32, color: "var(--brand)" }} />
              </div>
              <p style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                {search || filter !== "all" ? "No matching queries found" : "No history yet"}
              </p>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                {search
                  ? `No queries match "${search}"`
                  : filter !== "all"
                  ? "Try selecting a different chart type"
                  : "Go to AI Chat and ask your first question!"}
              </p>
              {(search || filter !== "all") && (
                <button onClick={() => { setSearch(""); setFilter("all"); }} style={{
                  marginTop: 20, padding: "10px 22px", borderRadius: 10,
                  background: "var(--brand-dim)", border: "1.5px solid var(--brand-border)",
                  color: "var(--brand)", fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.9375rem", fontWeight: 600, cursor: "pointer",
                }}>Clear filters</button>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Result count */}
              {(search || filter !== "all") && (
                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: 4 }}>
                  Showing {filtered.length} of {items.length} queries
                </p>
              )}

              {filtered.map((item, idx) => {
                const meta = CHART_META[item.chart_type] || CHART_META.table;
                const Icon = meta.Icon;
                return (
                  <div
                    key={item.id}
                    className="fade-up"
                    style={{ animationDelay: `${idx * 0.04}s` }}
                    onClick={() => router.push(`/dashboard/history/${item.id}`)}
                  >
                    <div style={{
                      display: "flex", alignItems: "center", gap: 16,
                      padding: "16px 20px", borderRadius: 16,
                      background: "var(--bg-card)",
                      border: "1.5px solid var(--border-subtle)",
                      boxShadow: "var(--shadow-sm)",
                      cursor: "pointer", transition: "all 0.18s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--brand-border)";
                      el.style.boxShadow = "var(--shadow-md), 0 0 0 1px var(--brand-border)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--border-subtle)";
                      el.style.boxShadow = "var(--shadow-sm)";
                      el.style.transform = "none";
                    }}>

                      {/* Chart icon */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                        background: meta.bg,
                        border: `1.5px solid ${meta.color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon style={{ width: 20, height: 20, color: meta.color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "1rem", fontWeight: 600,
                          color: "var(--text-primary)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          marginBottom: 5,
                        }}>
                          {item.question}
                        </p>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                            <Clock style={{ width: 13, height: 13 }} />
                            {timeAgo(item.timestamp)}
                          </span>
                          <span style={{
                            padding: "3px 10px", borderRadius: 99,
                            background: meta.bg, color: meta.color,
                            border: `1.5px solid ${meta.color}30`,
                            fontSize: "0.78rem", fontWeight: 700,
                            textTransform: "uppercase", letterSpacing: "0.04em",
                          }}>
                            {meta.label}
                          </span>
                          {item.insights && (
                            <span style={{
                              fontSize: "0.8125rem", color: "var(--text-muted)",
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                              maxWidth: 280,
                            }}>
                              {item.insights.replace(/\*\*/g, "").replace(/^[-•]\s*/gm, "").split("\n")[0]}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={e => deleteItem(item.id, e)}
                          disabled={deleting === item.id}
                          style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: "transparent", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--red)",
                            opacity: 0, transition: "opacity 0.15s",
                          }}
                          className="delete-btn"
                          title="Delete">
                          {deleting === item.id
                            ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" />
                            : <Trash2  style={{ width: 15, height: 15 }} />}
                        </button>
                        <ChevronRight style={{ width: 18, height: 18, color: "var(--text-muted)", opacity: 0.5 }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        div:hover .delete-btn { opacity: 1 !important; }
      `}</style>
    </div>
  );
}