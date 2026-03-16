"use client";
import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Trash2, RefreshCw,
  Sparkles, BarChart2, Code2, ChevronDown,
  Copy, Check, TrendingUp, Zap, Lightbulb,
} from "lucide-react";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(() => import("@/components/charts/ChartRenderer"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────
interface DataResult {
  generated_sql: string;
  chart_type: string;
  chart_data: unknown;
  table_data: Record<string, unknown>[] | null;
  insights: string;
  row_count: number;
  execution_time_ms: number;
  history_id: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  dataResult?: DataResult;
  loading?: boolean;
  error?: string;
  ts: Date;
}

type GeminiPart = { text: string };
type GeminiMessage = { role: "user" | "model"; parts: GeminiPart[] };

// ── Your Gemini key ───────────────────────────────────────────
const GEMINI_KEY = "AIzaSyDkMiTG9u-UKiw0t7jJEewDuZCi4qvx5v4";

// ── Gemini system context ─────────────────────────────────────
const SYSTEM_PROMPT = `You are Nykaa BI Assistant — a smart, friendly AI analyst built into the Nykaa Business Intelligence dashboard.

You have two capabilities:
1. Answer any general question like a helpful AI assistant (marketing, business, strategy, explanations, advice, etc.)
2. Analyze Nykaa's campaign database when the user asks for data insights

About the Nykaa database you have access to:
- 55,000+ digital marketing campaign records
- Columns: Campaign_ID, Campaign_Type, Target_Audience, Duration, Channel_Used, Impressions, Clicks, Leads, Conversions, Revenue, Acquisition_Cost, ROI, Language, Engagement_Score, Customer_Segment, Date
- Campaign types: Social Media, Paid Ads, Influencer, Email Marketing
- Channels: YouTube, Instagram, WhatsApp, Facebook, Google, Twitter
- Languages: Hindi, English, Tamil, Telugu, Bengali, etc.
- Target audiences: College Students, Working Women, Tier 2 City Customers, etc.
- Date range: 2024-2025

Behavior rules:
- Be conversational, friendly and professional
- Give detailed, insightful answers — not just one-liners
- When users ask for data/charts/analysis, acknowledge it naturally and let them know you are fetching the data
- When answering general questions, be like a knowledgeable marketing consultant
- Remember the full conversation context
- Format responses clearly with bullet points, bold text, and structure where helpful
- Never say you "cannot access" the database — you always have access to it`;

// ── Detect if query needs database ───────────────────────────
function needsData(text: string): boolean {
  const t = text.toLowerCase();
  const patterns = [
    /show|display|give me|get|fetch|find|list/,
    /chart|graph|plot|visualize|visual/,
    /revenue|roi|conversion|impression|click|lead|acquisition|engagement/,
    /campaign|channel|language|audience|segment/,
    /top|best|worst|highest|lowest|most|least/,
    /trend|over time|monthly|weekly|daily|compare/,
    /average|total|sum|count|how many|how much/,
    /analyze|analyse|analysis|breakdown|distribution/,
  ];
  return patterns.some(p => p.test(t));
}

// ── Call Gemini ───────────────────────────────────────────────
async function geminiChat(history: GeminiMessage[], userMsg: string): Promise<string> {
  const contents: GeminiMessage[] = [
    ...history,
    { role: "user", parts: [{ text: userMsg }] },
  ];

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text
    ?? "I couldn't generate a response. Please try again.";
}

// ── Helpers ───────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

function timeStr(d: Date) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Markdown renderer ─────────────────────────────────────────
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  let inCode = false;
  const codeLines: string[] = [];
  const result: React.ReactNode[] = [];

  const renderInline = (s: string, key: number) => {
    const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={key}>
        {parts.map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**"))
            return <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
          if (p.startsWith("`") && p.endsWith("`"))
            return <code key={j} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875em", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 5, color: "var(--brand)" }}>{p.slice(1, -1)}</code>;
          return p;
        })}
      </span>
    );
  };

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (!inCode) { inCode = true; codeLines.length = 0; }
      else {
        inCode = false;
        result.push(
          <pre key={i} style={{ margin: "10px 0", padding: "14px 16px", background: "var(--bg-elevated)", borderRadius: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem", lineHeight: 1.7, color: "var(--brand)", overflowX: "auto", border: "1px solid var(--border-subtle)" }}>
            {codeLines.join("\n")}
          </pre>
        );
      }
      return;
    }
    if (inCode) { codeLines.push(line); return; }

    if (!line.trim()) { result.push(<div key={i} style={{ height: 8 }} />); return; }

    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})/)?.[1].length ?? 1;
      const sizes = ["1.2rem", "1.1rem", "1rem"];
      result.push(<p key={i} style={{ fontSize: sizes[level-1], fontWeight: 700, color: "var(--text-primary)", margin: "10px 0 4px", letterSpacing: "-0.01em" }}>{renderInline(line.replace(/^#{1,3}\s/, ""), i)}</p>);
      return;
    }

    if (/^[-*•]\s/.test(line)) {
      result.push(
        <div key={i} className="flex gap-2" style={{ margin: "3px 0" }}>
          <span style={{ color: "var(--brand)", flexShrink: 0, marginTop: 1 }}>•</span>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>{renderInline(line.replace(/^[-*•]\s/, ""), i)}</p>
        </div>
      );
      return;
    }

    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      result.push(
        <div key={i} className="flex gap-2" style={{ margin: "3px 0" }}>
          <span style={{ color: "var(--brand)", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0, minWidth: 20 }}>{num}.</span>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>{renderInline(line.replace(/^\d+\.\s/, ""), i)}</p>
        </div>
      );
      return;
    }

    if (line.startsWith("> ")) {
      result.push(
        <div key={i} style={{ borderLeft: "3px solid var(--brand)", paddingLeft: 14, margin: "6px 0" }}>
          <p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>{renderInline(line.slice(2), i)}</p>
        </div>
      );
      return;
    }

    result.push(
      <p key={i} style={{ fontSize: "0.9375rem", lineHeight: 1.75, color: "var(--text-secondary)", margin: "3px 0" }}>
        {renderInline(line, i)}
      </p>
    );
  });

  return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{result}</div>;
}

// ── SQL Viewer ────────────────────────────────────────────────
function SqlViewer({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5"
        style={{ background: "var(--bg-elevated)", cursor: "pointer" }}>
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>View SQL</span>
          <span className="badge badge-brand" style={{ fontSize: "0.65rem", padding: "1px 7px" }}>READ ONLY</span>
        </div>
        <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ position: "relative" }} className="fade-in">
          <pre style={{ margin: 0, padding: "14px 18px", background: "var(--bg-card)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--brand)", overflowX: "auto", borderTop: "1px solid var(--border-subtle)" }}>{sql}</pre>
          <button onClick={async () => { await navigator.clipboard.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ position: "absolute", top: 10, right: 12, padding: "4px 12px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", color: copied ? "var(--emerald)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            {copied ? <><Check className="w-3 h-3" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Chart type badge colors ───────────────────────────────────
const CHART_INFO: Record<string, { label: string; color: string; bg: string }> = {
  bar:      { label: "Bar Chart",   color: "var(--brand)",   bg: "var(--brand-dim)"   },
  line:     { label: "Line Chart",  color: "var(--cyan)",    bg: "var(--cyan-dim)"    },
  area:     { label: "Area Chart",  color: "var(--cyan)",    bg: "var(--cyan-dim)"    },
  pie:      { label: "Pie Chart",   color: "var(--accent)",  bg: "var(--accent-dim)"  },
  doughnut: { label: "Donut Chart", color: "var(--accent)",  bg: "var(--accent-dim)"  },
  radar:    { label: "Radar Chart", color: "var(--emerald)", bg: "var(--emerald-dim)" },
  table:    { label: "Data Table",  color: "var(--amber)",   bg: "var(--amber-dim)"   },
};

// ── Suggestions ───────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: TrendingUp, text: "Show top 5 campaign types by revenue" },
  { icon: BarChart2,  text: "Which channel has the highest ROI?" },
  { icon: Zap,        text: "Monthly revenue trend as a line chart" },
  { icon: Lightbulb,  text: "What marketing strategy should Nykaa focus on?" },
  { icon: TrendingUp, text: "Compare conversions by language" },
  { icon: BarChart2,  text: "Donut chart of revenue by campaign type" },
  { icon: Zap,        text: "How can we reduce acquisition cost?" },
  { icon: Lightbulb,  text: "Best performing customer segments" },
];

// ── Main Component ────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [gemHistory, setGemHistory]   = useState<GeminiMessage[]>([]);
  const [input, setInput]             = useState("");
  const [loading, setLoading]         = useState(false);
  const bottomRef                     = useRef<HTMLDivElement>(null);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function resize() {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 140) + "px";
  }

  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    const msgId = uid();
    const aiId  = uid();
    const now   = new Date();

    setMessages(prev => [
      ...prev,
      { id: msgId, role: "user",      content: question, ts: now },
      { id: aiId,  role: "assistant", content: "", loading: true, ts: new Date() },
    ]);

    try {
      const wantsData = needsData(question);

      if (wantsData) {
        // Run Gemini + backend in parallel
        const [aiText, backendRes] = await Promise.allSettled([
          geminiChat(gemHistory, question),
          api.post("/api/chat/query", { question }),
        ]);

        const responseText = aiText.status === "fulfilled"
          ? aiText.value
          : "I analyzed your data — here are the results:";

        const dataResult = backendRes.status === "fulfilled"
          ? backendRes.value.data as DataResult
          : undefined;

        // Update Gemini history
        setGemHistory(prev => [
          ...prev,
          { role: "user",  parts: [{ text: question }] },
          { role: "model", parts: [{ text: responseText }] },
        ]);

        setMessages(prev => prev.map(m =>
          m.id === aiId
            ? { ...m, loading: false, content: responseText, dataResult, ts: new Date() }
            : m
        ));
      } else {
        // Pure Gemini conversation
        const responseText = await geminiChat(gemHistory, question);

        setGemHistory(prev => [
          ...prev,
          { role: "user",  parts: [{ text: question }] },
          { role: "model", parts: [{ text: responseText }] },
        ]);

        setMessages(prev => prev.map(m =>
          m.id === aiId
            ? { ...m, loading: false, content: responseText, ts: new Date() }
            : m
        ));
      }
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { detail?: string } } };
      const errMsg = e.response?.data?.detail || e.message || "Something went wrong. Please try again.";
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, loading: false, error: errMsg } : m
      ));
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div className="flex-shrink-0 glass flex items-center justify-between px-6"
        style={{ height: 62, borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 38, height: 38, borderRadius: 12, flexShrink: 0,
            background: "linear-gradient(135deg, var(--brand), var(--accent))",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px var(--brand-glow)",
          }}>
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-display" style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>
              Nykaa BI Assistant
            </p>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)", boxShadow: "0 0 6px var(--emerald)" }} />
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Gemini 1.5 Flash · Nykaa campaigns database
              </span>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setGemHistory([]); }}
            className="btn-ghost btn-sm"
            title="Clear chat">
            <Trash2 className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* ── MESSAGES ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "32px 28px 16px" }}>

        {/* Welcome screen */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100% - 40px)", textAlign: "center", paddingBottom: 32 }}>

            <div style={{
              width: 88, height: 88, borderRadius: 28, marginBottom: 24,
              background: "linear-gradient(135deg, var(--brand), var(--accent))",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px var(--brand-glow)",
            }} className="animate-float">
              <Sparkles style={{ width: 44, height: 44, color: "white" }} />
            </div>

            <h2 className="font-display" style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 14, letterSpacing: "-0.03em" }}>
              Hi, I&apos;m your Nykaa BI Assistant
            </h2>

            <p style={{ fontSize: "1.0625rem", color: "var(--text-muted)", maxWidth: 540, lineHeight: 1.75, marginBottom: 8 }}>
              I&apos;m powered by <strong style={{ color: "var(--brand)" }}>Google Gemini 1.5 Flash</strong> and have direct access
              to Nykaa&apos;s marketing campaign database with <strong style={{ color: "var(--text-primary)" }}>55,000+ records</strong>.
            </p>

            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", maxWidth: 500, lineHeight: 1.7, marginBottom: 36 }}>
              Ask me anything — campaign analysis, chart generation, marketing strategy,
              business insights, or just a general question. I remember our full conversation.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxWidth: 700, width: "100%" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)}
                  className="card-pro interactive text-left"
                  style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-dim)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <s.icon className="w-4 h-4" style={{ color: "var(--brand)" }} />
                  </div>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => (
          <div key={msg.id}>

            {/* User message */}
            {msg.role === "user" && (
              <div className="flex justify-end gap-3 fade-up" style={{ marginBottom: 20 }}>
                <div style={{ maxWidth: 580 }}>
                  <div style={{
                    background: "linear-gradient(135deg, var(--brand), var(--accent))",
                    color: "white", borderRadius: "20px 20px 5px 20px",
                    padding: "13px 18px", fontSize: "1rem", lineHeight: 1.6,
                    boxShadow: "0 4px 16px var(--brand-glow)",
                  }}>
                    {msg.content}
                  </div>
                  <p style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 5 }}>
                    {timeStr(msg.ts)}
                  </p>
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                  background: "linear-gradient(135deg, var(--brand), var(--accent))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* AI message */}
            {msg.role === "assistant" && (
              <div className="flex gap-3 fade-up" style={{ marginBottom: 28 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                  background: "linear-gradient(135deg, var(--brand), var(--accent))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px var(--brand-glow)",
                }}>
                  <Bot className="w-4 h-4 text-white" />
                </div>

                <div style={{ flex: 1, maxWidth: 880 }}>

                  {/* Typing indicator */}
                  {msg.loading && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "5px 18px 18px 18px", boxShadow: "var(--shadow-sm)" }}>
                      {[0,1,2].map(i => (
                        <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--brand)", display: "inline-block", opacity: 0.4, animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />
                      ))}
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginLeft: 4 }}>Thinking...</span>
                    </div>
                  )}

                  {/* Error */}
                  {msg.error && (
                    <div style={{ padding: "13px 18px", borderRadius: "5px 18px 18px 18px", background: "var(--red-dim)", border: "1.5px solid rgba(220,38,38,0.2)", color: "var(--red)", fontSize: "0.9375rem" }}>
                      ⚠ {msg.error}
                    </div>
                  )}

                  {/* AI text */}
                  {msg.content && !msg.loading && (
                    <div style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "5px 18px 18px 18px", boxShadow: "var(--shadow-sm)", marginBottom: msg.dataResult ? 12 : 0 }} className="fade-in">
                      <Markdown text={msg.content} />
                    </div>
                  )}

                  {/* Data visualization */}
                  {msg.dataResult && !msg.loading && (
                    <div className="fade-in">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 10 }}>
                        {(() => {
                          const ct = CHART_INFO[msg.dataResult.chart_type] || CHART_INFO.table;
                          return <span className="badge" style={{ background: ct.bg, color: ct.color, border: `1px solid ${ct.color}30`, fontSize: "0.78rem" }}><BarChart2 className="w-3 h-3" style={{ marginRight: 3 }} />{ct.label}</span>;
                        })()}
                        <span className="badge badge-neutral" style={{ fontSize: "0.78rem" }}>{msg.dataResult.row_count} rows</span>
                        <span className="badge badge-neutral" style={{ fontSize: "0.78rem" }}>{msg.dataResult.execution_time_ms.toFixed(0)}ms</span>
                      </div>

                      {/* Chart */}
                      {(msg.dataResult.chart_data || msg.dataResult.table_data) && (
                        <div className="card-pro" style={{ padding: "20px 20px 14px", marginBottom: 0 }}>
                          <ChartRenderer
                            chartType={msg.dataResult.chart_type}
                            chartData={msg.dataResult.chart_data as never}
                            tableData={msg.dataResult.table_data}
                            historyId={msg.dataResult.history_id}
                          />
                        </div>
                      )}

                      {/* Backend insights */}
                      {msg.dataResult.insights && (
                        <div style={{ marginTop: 10, padding: "14px 18px", borderRadius: 12, background: "var(--brand-dim)", border: "1.5px solid var(--brand-border)" }}>
                          <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--brand)" }}>Data Insights</span>
                          </div>
                          <Markdown text={msg.dataResult.insights} />
                        </div>
                      )}

                      {/* SQL */}
                      {msg.dataResult.generated_sql && <SqlViewer sql={msg.dataResult.generated_sql} />}
                    </div>
                  )}

                  {!msg.loading && (
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 6, paddingLeft: 2 }}>
                      Gemini 1.5 Flash · {timeStr(msg.ts)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ────────────────────────────────────────── */}
      <div className="flex-shrink-0 glass" style={{ borderTop: "1px solid var(--border-subtle)", padding: "14px 24px 20px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); resize(); }}
              onKeyDown={onKey}
              disabled={loading}
              placeholder="Ask anything — data analysis, charts, marketing advice, or any question..."
              rows={1}
              className="input-pro"
              style={{ flex: 1, resize: "none", minHeight: 52, maxHeight: 140, paddingTop: 15, paddingBottom: 15, fontSize: "1rem", lineHeight: 1.55 }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: "linear-gradient(135deg, var(--brand), var(--accent))",
                border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 14px var(--brand-glow)",
                opacity: (!input.trim() || loading) ? 0.45 : 1,
                transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseEnter={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}>
              {loading ? <RefreshCw className="w-5 h-5 text-white animate-spin" /> : <Send className="w-5 h-5 text-white" />}
            </button>
          </div>
          <p style={{ textAlign: "center", fontSize: "0.775rem", color: "var(--text-disabled)", marginTop: 9 }}>
            Enter to send · Shift+Enter for new line · Remembers full conversation · Powered by Google Gemini
          </p>
        </div>
      </div>
    </div>
  );
}