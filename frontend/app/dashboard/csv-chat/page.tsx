"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Sparkles, Database, BarChart2 } from "lucide-react";
import { uploadApi, chatApi } from "@/lib/api";
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(() => import("@/components/charts/ChartRenderer"), { ssr: false });

interface Message {
  id: number;
  role: "user" | "assistant";
  question?: string;
  chart_type?: string;
  chart_data?: unknown;
  table_data?: Record<string, unknown>[] | null;
  insights?: string;
  sql?: string;
  row_count?: number;
  exec_ms?: number;
  error?: string;
}

function CSVChatInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const fileName     = searchParams.get("file") || "";
  const [meta, setMeta]               = useState<{ name: string; rows: number; columns: string[]; table_name: string } | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgId     = useRef(0);

  useEffect(() => {
    if (!fileName) return;
    uploadApi.meta(fileName)
      .then(r => setMeta(r.data))
      .catch(() => setMeta(null))
      .finally(() => setMetaLoading(false));
  }, [fileName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading || !fileName) return;
    const question = input.trim();
    setInput("");

    const userMsg: Message = { id: ++msgId.current, role: "user", question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatApi.csvQuery(question, fileName);
      const d = res.data;
      const aiMsg: Message = {
        id:         ++msgId.current,
        role:       "assistant",
        chart_type: d.chart_type,
        chart_data: d.chart_data,
        table_data: d.table_data,
        insights:   d.insights,
        sql:        d.generated_sql,
        row_count:  d.row_count,
        exec_ms:    d.execution_time_ms,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setMessages(prev => [...prev, {
        id: ++msgId.current, role: "assistant",
        error: err.response?.data?.detail || "Something went wrong. Try again.",
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (metaLoading) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid rgba(157,0,57,0.2)", borderTopColor: "#9D0039", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-muted)" }}>Loading dataset...</p>
      </div>
    </div>
  );

  if (!meta) return (
    <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.125rem" }}>Dataset not found</p>
        <button onClick={() => router.back()} style={{ marginTop: 16, color: "var(--brand)", background: "none", border: "none", cursor: "pointer" }}>
          ← Go back
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* Header */}
      <div className="flex-shrink-0 glass flex items-center gap-4 px-6"
        style={{ height: 64, borderBottom: "1px solid var(--border-subtle)" }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: 10,
          background: "var(--bg-elevated)", border: "1.5px solid var(--border-default)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "var(--text-muted)",
        }}>
          <ArrowLeft style={{ width: 16, height: 16 }} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #9D0039, #E8005A)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Database style={{ width: 16, height: 16, color: "white" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {meta.name}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {meta.rows.toLocaleString()} rows · {meta.columns.length} columns · {meta.columns.slice(0, 4).join(", ")}{meta.columns.length > 4 ? "..." : ""}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "24px 28px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Welcome screen */}
          {messages.length === 0 && (
            <div style={{
              textAlign: "center", padding: "48px 24px",
              background: "var(--bg-card)", borderRadius: 20,
              border: "1.5px solid var(--border-subtle)",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                background: "linear-gradient(135deg, #9D0039, #E8005A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 8px 24px rgba(157,0,57,0.30)",
              }}>
                <Sparkles style={{ width: 24, height: 24, color: "white" }} />
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                Chat with your CSV
              </h2>
              <p style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: 24 }}>
                Ask any question about <strong style={{ color: "var(--brand)" }}>{meta.name}</strong>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
                {[
                  `Show top 5 rows by ${meta.columns[1] || meta.columns[0]}`,
                  `Count total rows`,
                  `Show distribution of ${meta.columns[0]}`,
                  `What are the averages of numeric columns?`,
                ].map((s, i) => (
                  <button key={i} onClick={() => setInput(s)}
                    style={{
                      padding: "8px 16px", borderRadius: 99,
                      background: "var(--bg-elevated)",
                      border: "1.5px solid var(--border-default)",
                      color: "var(--text-secondary)", fontSize: "0.875rem",
                      cursor: "pointer", fontWeight: 500, transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#9D0039"; (e.currentTarget as HTMLElement).style.color = "#9D0039"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{
                    maxWidth: "70%", padding: "12px 18px",
                    borderRadius: "18px 18px 4px 18px",
                    background: "linear-gradient(135deg, #9D0039, #E8005A)",
                    color: "white", fontSize: "1rem", fontWeight: 500, lineHeight: 1.5,
                    boxShadow: "0 4px 14px rgba(157,0,57,0.30)",
                  }}>
                    {msg.question}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
                  borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-card)",
                }}>
                  {msg.error ? (
                    <div style={{ padding: "16px 20px", color: "var(--red)", fontSize: "0.9375rem" }}>
                      ⚠️ {msg.error}
                    </div>
                  ) : (
                    <>
                      {/* Chart */}
                      {(msg.chart_data || msg.table_data) && (
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <BarChart2 style={{ width: 16, height: 16, color: "#9D0039" }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9D0039" }}>
                              {msg.chart_type} · {msg.row_count} rows · {msg.exec_ms?.toFixed(0)}ms
                            </span>
                          </div>
                          <ChartRenderer
                            chartType={msg.chart_type || "bar"}
                            chartData={msg.chart_data as never}
                            tableData={msg.table_data || null}
                            historyId={0}
                          />
                        </div>
                      )}
                      {/* Insights */}
                      {msg.insights && (
                        <div style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <Sparkles style={{ width: 14, height: 14, color: "#9D0039" }} />
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#9D0039" }}>
                              AI Insights
                            </span>
                          </div>
                          {msg.insights.split("\n").filter(l => l.trim()).map((line, i) => {
                            const clean = line.replace(/^[-•]\s*/, "");
                            const parts = clean.split(/\*\*(.+?)\*\*/g);
                            return (
                              <p key={i} style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: "4px 0", display: "flex", gap: 8 }}>
                                <span style={{ color: "#9D0039", flexShrink: 0 }}>•</span>
                                <span>{parts.map((pt, j) => j % 2 === 1
                                  ? <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{pt}</strong>
                                  : pt)}</span>
                              </p>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading bubble */}
          {loading && (
            <div style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
              borderRadius: 20, padding: "20px 24px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                background: "linear-gradient(135deg, #9D0039, #E8005A)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles style={{ width: 14, height: 14, color: "white" }} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: 9, height: 9, borderRadius: "50%",
                    background: "#9D0039", opacity: 0.4, display: "inline-block",
                    animation: "typingDot 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 glass" style={{ padding: "16px 28px", borderTop: "1px solid var(--border-subtle)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={`Ask anything about ${meta.name}...`}
              rows={1}
              style={{
                width: "100%", padding: "14px 18px", borderRadius: 14,
                background: "var(--bg-input)", border: "1.5px solid var(--border-default)",
                color: "var(--text-primary)", fontSize: "1rem", resize: "none",
                outline: "none", fontFamily: "inherit", lineHeight: 1.5,
                boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "#9D0039")}
              onBlur={e => (e.target.style.borderColor = "var(--border-default)")}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              width: 48, height: 48, borderRadius: 14, flexShrink: 0,
              background: loading || !input.trim() ? "var(--bg-elevated)" : "linear-gradient(135deg, #9D0039, #E8005A)",
              border: "none", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: loading || !input.trim() ? "none" : "0 4px 14px rgba(157,0,57,0.35)",
              transition: "all 0.15s",
            }}>
            <Send style={{ width: 18, height: 18, color: loading || !input.trim() ? "var(--text-muted)" : "white" }} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CSVChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </div>
    }>
      <CSVChatInner />
    </Suspense>
  );
}