"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, Trash2, RefreshCw,
  Sparkles, BarChart2, Code2, ChevronDown,
  Copy, Check, TrendingUp, Zap, Lightbulb,
  Mic, MicOff, Pencil, X, Database, Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";

const ChartRenderer = dynamic(() => import("@/components/charts/ChartRenderer"), { ssr: false });

// ── Speech Recognition Types ──────────────────────────────────
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

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
- Give detailed, insightful answers
- When users ask for data/charts/analysis, acknowledge it naturally
- Remember the full conversation context
- Format responses clearly with bullet points, bold text, and structure
- Never say you cannot access the database`;

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

async function geminiChat(history: GeminiMessage[], userMsg: string): Promise<string> {
  const messages = [
    ...history,
    { role: "user", parts: [{ text: userMsg }] },
  ];
  const res = await api.post("/api/gemini/chat", {
    messages,
    system_prompt: SYSTEM_PROMPT,
  });
  return res.data.text ?? "I couldn't generate a response.";
}

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function timeStr(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

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
            return <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{p.slice(2,-2)}</strong>;
          if (p.startsWith("`") && p.endsWith("`"))
            return <code key={j} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875em", background: "var(--bg-elevated)", padding: "1px 6px", borderRadius: 5, color: "var(--brand)" }}>{p.slice(1,-1)}</code>;
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
        result.push(<pre key={i} style={{ margin: "10px 0", padding: "14px 16px", background: "var(--bg-elevated)", borderRadius: 10, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.875rem", lineHeight: 1.7, color: "var(--brand)", overflowX: "auto", border: "1px solid var(--border-subtle)" }}>{codeLines.join("\n")}</pre>);
      }
      return;
    }
    if (inCode) { codeLines.push(line); return; }
    if (!line.trim()) { result.push(<div key={i} style={{ height: 8 }} />); return; }
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^(#{1,3})/)?.[1].length ?? 1;
      const sizes = ["1.2rem","1.1rem","1rem"];
      result.push(<p key={i} style={{ fontSize: sizes[level-1], fontWeight: 700, color: "var(--text-primary)", margin: "10px 0 4px" }}>{renderInline(line.replace(/^#{1,3}\s/,""),i)}</p>);
      return;
    }
    if (/^[-*•]\s/.test(line)) {
      result.push(<div key={i} style={{ display: "flex", gap: 8, margin: "3px 0" }}><span style={{ color: "var(--brand)", flexShrink: 0 }}>•</span><p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>{renderInline(line.replace(/^[-*•]\s/,""),i)}</p></div>);
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      result.push(<div key={i} style={{ display: "flex", gap: 8, margin: "3px 0" }}><span style={{ color: "var(--brand)", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0, minWidth: 20 }}>{num}.</span><p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", margin: 0 }}>{renderInline(line.replace(/^\d+\.\s/,""),i)}</p></div>);
      return;
    }
    if (line.startsWith("> ")) {
      result.push(<div key={i} style={{ borderLeft: "3px solid var(--brand)", paddingLeft: 14, margin: "6px 0" }}><p style={{ fontSize: "0.9375rem", lineHeight: 1.7, color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>{renderInline(line.slice(2),i)}</p></div>);
      return;
    }
    result.push(<p key={i} style={{ fontSize: "0.9375rem", lineHeight: 1.75, color: "var(--text-secondary)", margin: "3px 0" }}>{renderInline(line,i)}</p>);
  });
  return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{result}</div>;
}

function SqlViewer({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginTop: 12, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "var(--bg-elevated)", cursor: "pointer", border: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Code2 style={{ width: 14, height: 14, color: "var(--brand)" }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>View SQL</span>
          <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 7px", borderRadius: 99, background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>READ ONLY</span>
        </div>
        <ChevronDown style={{ width: 14, height: 14, color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      {open && (
        <div style={{ position: "relative", borderTop: "1px solid var(--border-subtle)" }}>
          <pre style={{ margin: 0, padding: "14px 18px", background: "var(--bg-card)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--brand)", overflowX: "auto" }}>{sql}</pre>
          <button onClick={async () => { await navigator.clipboard.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            style={{ position: "absolute", top: 10, right: 12, padding: "4px 12px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", color: copied ? "var(--emerald)" : "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
            {copied ? <><Check style={{ width: 12, height: 12 }} />Copied</> : <><Copy style={{ width: 12, height: 12 }} />Copy</>}
          </button>
        </div>
      )}
    </div>
  );
}

const CHART_INFO: Record<string, { label: string; color: string; bg: string }> = {
  bar:      { label: "Bar Chart",   color: "var(--brand)",   bg: "var(--brand-dim)"   },
  line:     { label: "Line Chart",  color: "var(--cyan)",    bg: "var(--cyan-dim)"    },
  area:     { label: "Area Chart",  color: "var(--cyan)",    bg: "var(--cyan-dim)"    },
  pie:      { label: "Pie Chart",   color: "var(--accent)",  bg: "var(--accent-dim)"  },
  doughnut: { label: "Donut Chart", color: "var(--accent)",  bg: "var(--accent-dim)"  },
  radar:    { label: "Radar Chart", color: "var(--emerald)", bg: "var(--emerald-dim)" },
  table:    { label: "Data Table",  color: "var(--amber)",   bg: "var(--amber-dim)"   },
};

const SUGGESTIONS = [
  { icon: TrendingUp, text: "Show top 5 campaign types by revenue",        tag: "Revenue"  },
  { icon: BarChart2,  text: "Which channel has the highest ROI?",           tag: "ROI"      },
  { icon: Zap,        text: "Monthly revenue trend as a line chart",        tag: "Trend"    },
  { icon: Lightbulb,  text: "What marketing strategy should Nykaa focus on?", tag: "Strategy"},
  { icon: TrendingUp, text: "Compare conversions by language",              tag: "Compare"  },
  { icon: BarChart2,  text: "Donut chart of revenue by campaign type",      tag: "Chart"    },
  { icon: Zap,        text: "How can we reduce acquisition cost?",          tag: "Optimize" },
  { icon: Lightbulb,  text: "Best performing customer segments",            tag: "Segments" },
];

export default function ChatPage() {
  const [messages, setMessages]         = useState<Message[]>([]);
  const [gemHistory, setGemHistory]     = useState<GeminiMessage[]>([]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editText, setEditText]         = useState("");
  const [isListening, setIsListening]   = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [transcript, setTranscript]     = useState("");
  const bottomRef      = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const editRef        = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check voice support
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      setVoiceSupported(!!SR);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function resize() {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 140) + "px";
  }

  // ── Voice to Text ──────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!voiceSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onstart = () => { setIsListening(true); setTranscript(""); };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setTranscript(interim);
      if (final) {
        setInput(prev => (prev + " " + final).trim());
        setTranscript("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
        }
      }
    };

    recognition.onerror  = () => { setIsListening(false); setTranscript(""); };
    recognition.onend    = () => { setIsListening(false); setTranscript(""); };

    recognitionRef.current = recognition;
    recognition.start();
  }, [voiceSupported]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setTranscript("");
  }, []);

  // ── Send Message ───────────────────────────────────────────
  async function sendMessage(question: string) {
    if (!question.trim() || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    const msgId = uid();
    const aiId  = uid();

    setMessages(prev => [
      ...prev,
      { id: msgId, role: "user",      content: question, ts: new Date() },
      { id: aiId,  role: "assistant", content: "", loading: true, ts: new Date() },
    ]);

    try {
      const wantsData = needsData(question);
      if (wantsData) {
        const [aiText, backendRes] = await Promise.allSettled([
          geminiChat(gemHistory, question),
          api.post("/api/chat/query", { question }),
        ]);
        const responseText = aiText.status === "fulfilled" ? aiText.value : "I analyzed your data — here are the results:";
        const dataResult   = backendRes.status === "fulfilled" ? backendRes.value.data as DataResult : undefined;
        setGemHistory(prev => [...prev, { role: "user", parts: [{ text: question }] }, { role: "model", parts: [{ text: responseText }] }]);
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, loading: false, content: responseText, dataResult, ts: new Date() } : m));
      } else {
        const responseText = await geminiChat(gemHistory, question);
        setGemHistory(prev => [...prev, { role: "user", parts: [{ text: question }] }, { role: "model", parts: [{ text: responseText }] }]);
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, loading: false, content: responseText, ts: new Date() } : m));
      }
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { detail?: string } } };
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, loading: false, error: e.response?.data?.detail || e.message || "Something went wrong." } : m));
    } finally {
      setLoading(false);
    }
  }

  // ── Delete Message ─────────────────────────────────────────
  function deleteMessage(id: string) {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx === -1) return prev;
      const toRemove = new Set([id]);
      if (prev[idx].role === "user" && prev[idx + 1]?.role === "assistant") {
        toRemove.add(prev[idx + 1].id);
      }
      return prev.filter(m => !toRemove.has(m.id));
    });
  }

  // ── Edit Message ───────────────────────────────────────────
  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditText(msg.content);
    setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 50);
  }

  function cancelEdit() { setEditingId(null); setEditText(""); }

  async function submitEdit(msgId: string) {
    if (!editText.trim()) return;
    const idx = messages.findIndex(m => m.id === msgId);
    if (idx === -1) return;
    setMessages(prev => prev.slice(0, idx));
    setEditingId(null);
    setEditText("");
    await sendMessage(editText.trim());
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* ── TOP BAR ── */}
      <div className="flex-shrink-0 glass flex items-center justify-between px-6"
        style={{ height: 64, borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: "linear-gradient(135deg, var(--brand), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px var(--brand-glow)" }}>
            <Bot style={{ width: 18, height: 18, color: "white" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 2 }}>
            <p className="font-display" style={{ fontSize: "1.0625rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2, margin: 0 }}>
              Nykaa BI Assistant
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)", boxShadow: "0 0 6px var(--emerald)", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>Groq · Nykaa campaigns database</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "var(--brand-dim)", border: "1px solid var(--brand-border)" }}>
            <Database style={{ width: 12, height: 12, color: "var(--brand)" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)" }}>55K+ Records</span>
          </div>
          {messages.length > 0 && (
            <button onClick={() => { setMessages([]); setGemHistory([]); }} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10,
              background: "var(--bg-elevated)", border: "1.5px solid var(--border-default)",
              color: "var(--text-muted)", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--red)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--red)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}>
              <Trash2 style={{ width: 14, height: 14 }} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: "32px 28px 16px" }}>

        {/* Welcome */}
        {messages.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100% - 40px)", textAlign: "center", paddingBottom: 32 }}>
            <div style={{ width: 88, height: 88, borderRadius: 28, marginBottom: 24, background: "linear-gradient(135deg, var(--brand), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 32px var(--brand-glow)", animation: "float 3s ease-in-out infinite" }}>
              <Sparkles style={{ width: 44, height: 44, color: "white" }} />
            </div>
            <h2 className="font-display" style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: 14, letterSpacing: "-0.03em" }}>
              Hi, I&apos;m your Nykaa BI Assistant
            </h2>
            <p style={{ fontSize: "1.0625rem", color: "var(--text-muted)", maxWidth: 540, lineHeight: 1.75, marginBottom: 8 }}>
              I&apos;m powered by <strong style={{ color: "var(--brand)" }}>Groq</strong> and have direct access to Nykaa&apos;s marketing campaign database with <strong style={{ color: "var(--text-primary)" }}>55,000+ records</strong>.
            </p>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", maxWidth: 500, lineHeight: 1.7, marginBottom: 36 }}>
              Ask me anything — campaign analysis, chart generation, marketing strategy, business insights, or just a general question.
              {voiceSupported && <span style={{ color: "var(--brand)", fontWeight: 600 }}> 🎤 Voice input supported!</span>}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, maxWidth: 720, width: "100%" }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s.text)} style={{
                  padding: "13px 16px", display: "flex", alignItems: "center", gap: 12,
                  borderRadius: 14, cursor: "pointer", textAlign: "left",
                  background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
                  transition: "all 0.18s ease", boxShadow: "var(--shadow-sm)",
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--brand-border)"; el.style.transform = "translateY(-2px)"; el.style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--border-subtle)"; el.style.transform = "none"; el.style.boxShadow = "var(--shadow-sm)"; }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--brand-dim)", border: "1px solid var(--brand-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <s.icon style={{ width: 16, height: 16, color: "var(--brand)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>{s.text}</span>
                  </div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", padding: "2px 8px", borderRadius: 99, background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand-border)", flexShrink: 0 }}>{s.tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(msg => (
          <div key={msg.id} className="fade-up">

            {/* User message */}
            {msg.role === "user" && (
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 20 }}>
                <div style={{ maxWidth: 580 }}>
                  {editingId === msg.id ? (
                    // ── Edit mode ──
                    <div style={{ background: "var(--bg-card)", border: "1.5px solid var(--brand-border)", borderRadius: "18px 18px 4px 18px", padding: "12px 16px", boxShadow: "0 4px 20px var(--brand-glow)" }}>
                      <textarea
                        ref={editRef}
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitEdit(msg.id); } if (e.key === "Escape") cancelEdit(); }}
                        style={{ width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", lineHeight: 1.6, minHeight: 60 }}
                        rows={2}
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 8, justifyContent: "flex-end" }}>
                        <button onClick={cancelEdit} style={{ padding: "5px 12px", borderRadius: 8, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <X style={{ width: 12, height: 12 }} /> Cancel
                        </button>
                        <button onClick={() => submitEdit(msg.id)} style={{ padding: "5px 14px", borderRadius: 8, background: "linear-gradient(135deg, var(--brand), var(--accent))", border: "none", color: "white", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                          <Send style={{ width: 12, height: 12 }} /> Resend
                        </button>
                      </div>
                    </div>
                  ) : (
                    // ── Normal message ──
                    <div style={{ position: "relative" }}
                      onMouseEnter={e => { const btns = (e.currentTarget as HTMLElement).querySelector(".msg-actions") as HTMLElement; if (btns) btns.style.opacity = "1"; }}
                      onMouseLeave={e => { const btns = (e.currentTarget as HTMLElement).querySelector(".msg-actions") as HTMLElement; if (btns) btns.style.opacity = "0"; }}>
                      <div style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))", color: "white", borderRadius: "20px 20px 5px 20px", padding: "13px 18px", fontSize: "0.9375rem", lineHeight: 1.6, boxShadow: "0 4px 16px var(--brand-glow)" }}>
                        {msg.content}
                      </div>
                      {/* Hover action buttons */}
                      <div className="msg-actions" style={{ position: "absolute", top: -10, left: -88, display: "flex", gap: 4, opacity: 0, transition: "opacity 0.15s" }}>
                        <button onClick={() => startEdit(msg)} title="Edit message" style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg-card)", border: "1.5px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--brand)", boxShadow: "var(--shadow-sm)", transition: "all 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--brand-dim)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}>
                          <Pencil style={{ width: 13, height: 13 }} />
                        </button>
                        <button onClick={() => deleteMessage(msg.id)} title="Delete message" style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg-card)", border: "1.5px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--red)", boxShadow: "var(--shadow-sm)", transition: "all 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--red)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-card)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 4 }}>
                        <Clock style={{ width: 11, height: 11, color: "var(--text-muted)" }} />
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>{timeStr(msg.ts)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: "linear-gradient(135deg, var(--brand), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User style={{ width: 15, height: 15, color: "white" }} />
                </div>
              </div>
            )}

            {/* AI message */}
            {msg.role === "assistant" && (
              <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, marginTop: 2, background: "linear-gradient(135deg, var(--brand), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px var(--brand-glow)" }}>
                  <Bot style={{ width: 15, height: 15, color: "white" }} />
                </div>
                <div style={{ flex: 1, maxWidth: 880 }}>
                  {msg.loading && (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "14px 20px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "5px 18px 18px 18px", boxShadow: "var(--shadow-sm)" }}>
                      {[0,1,2].map(i => <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: "var(--brand)", display: "inline-block", opacity: 0.4, animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />)}
                      <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginLeft: 4 }}>Thinking...</span>
                    </div>
                  )}
                  {msg.error && (
                    <div style={{ padding: "13px 18px", borderRadius: "5px 18px 18px 18px", background: "var(--red-dim)", border: "1.5px solid rgba(220,38,38,0.2)", color: "var(--red)", fontSize: "0.9375rem" }}>⚠ {msg.error}</div>
                  )}
                  {msg.content && !msg.loading && (
                    <div style={{ padding: "16px 20px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "5px 18px 18px 18px", boxShadow: "var(--shadow-sm)", marginBottom: msg.dataResult ? 12 : 0 }}>
                      <Markdown text={msg.content} />
                    </div>
                  )}
                  {msg.dataResult && !msg.loading && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                        {(() => { const ct = CHART_INFO[msg.dataResult.chart_type] || CHART_INFO.table; return <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 12px", borderRadius: 99, background: ct.bg, color: ct.color, border: `1px solid ${ct.color}30`, fontSize: "0.775rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}><BarChart2 style={{ width: 12, height: 12 }} />{ct.label}</span>; })()}
                        <span style={{ padding: "4px 10px", borderRadius: 99, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-default)", fontSize: "0.775rem", fontWeight: 600 }}>{msg.dataResult.row_count} rows</span>
                        <span style={{ padding: "4px 10px", borderRadius: 99, background: "var(--bg-elevated)", color: "var(--text-muted)", border: "1px solid var(--border-default)", fontSize: "0.775rem", fontWeight: 600 }}>{msg.dataResult.execution_time_ms.toFixed(0)}ms</span>
                      </div>
                      {(msg.dataResult.chart_data || msg.dataResult.table_data) && (
                        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: 18, padding: "20px", marginBottom: 10, boxShadow: "var(--shadow-card)" }}>
                          <ChartRenderer chartType={msg.dataResult.chart_type} chartData={msg.dataResult.chart_data as never} tableData={msg.dataResult.table_data} historyId={msg.dataResult.history_id} />
                        </div>
                      )}
                      {msg.dataResult.insights && (
                        <div style={{ marginTop: 10, padding: "14px 18px", borderRadius: 14, background: "linear-gradient(135deg, var(--brand-dim), rgba(232,0,90,0.04))", border: "1.5px solid var(--brand-border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <div style={{ width: 24, height: 24, borderRadius: 7, background: "linear-gradient(135deg, var(--brand), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Sparkles style={{ width: 12, height: 12, color: "white" }} />
                            </div>
                            <span style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand)" }}>Data Insights</span>
                          </div>
                          <Markdown text={msg.dataResult.insights} />
                        </div>
                      )}
                      {msg.dataResult.generated_sql && <SqlViewer sql={msg.dataResult.generated_sql} />}
                    </div>
                  )}
                  {!msg.loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                      <Clock style={{ width: 11, height: 11, color: "var(--text-muted)" }} />
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>Groq · {timeStr(msg.ts)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT BAR ── */}
      <div className="flex-shrink-0 glass" style={{ borderTop: "1px solid var(--border-subtle)", padding: "14px 24px 20px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>

          {/* Voice transcript preview */}
          {(isListening || transcript) && (
            <div style={{ marginBottom: 10, padding: "10px 16px", borderRadius: 12, background: "linear-gradient(135deg, var(--brand-dim), rgba(232,0,90,0.05))", border: "1.5px solid var(--brand-border)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E8005A", animation: "pulse 0.8s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontSize: "0.875rem", color: "var(--brand)", fontWeight: 500, fontStyle: transcript ? "italic" : "normal" }}>
                {transcript || "Listening... speak now"}
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
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

            {/* Voice button */}
            {voiceSupported && (
              <button onClick={isListening ? stopListening : startListening} disabled={loading} title={isListening ? "Stop listening" : "Voice input"}
                style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: isListening ? "linear-gradient(135deg, #E8005A, #FF4D8F)" : "var(--bg-elevated)", border: isListening ? "none" : "1.5px solid var(--border-default)", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: isListening ? "0 4px 16px rgba(232,0,90,0.40)" : "none", transition: "all 0.18s ease", opacity: loading ? 0.5 : 1 }}>
                {isListening
                  ? <MicOff style={{ width: 20, height: 20, color: "white" }} />
                  : <Mic style={{ width: 20, height: 20, color: "var(--brand)" }} />}
              </button>
            )}

            {/* Send button */}
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
              style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, background: "linear-gradient(135deg, var(--brand), var(--accent))", border: "none", cursor: !input.trim() || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px var(--brand-glow)", opacity: (!input.trim() || loading) ? 0.45 : 1, transition: "opacity 0.15s, transform 0.15s" }}
              onMouseEnter={e => { if (input.trim() && !loading) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.04)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; }}>
              {loading ? <RefreshCw style={{ width: 20, height: 20, color: "white", animation: "spin 1s linear infinite" }} /> : <Send style={{ width: 20, height: 20, color: "white" }} />}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "0.72rem", color: "var(--text-disabled)", marginTop: 8 }}>
            Enter to send · Shift+Enter for new line · Hover message to edit/delete
            {voiceSupported && " · 🎤 Mic for voice input"}
          </p>
        </div>
      </div>
    </div>
  );
}