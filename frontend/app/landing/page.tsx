"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessageSquare, BarChart3, Sparkles, ArrowRight,
  Shield, Clock, TrendingUp, Brain, Star, CheckCircle2,
  Zap, History, Sun, Moon,
} from "lucide-react";

const STATS = [
  { value: "55K+",  label: "Campaign Records",  icon: BarChart3 },
  { value: "6",     label: "Chart Types",        icon: TrendingUp },
  { value: "AI",    label: "Gemini Powered",     icon: Brain },
  { value: "100%",  label: "Secure Queries",     icon: Shield },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Natural Language to SQL",
    desc: "Type any question in plain English. Gemini AI instantly converts it to optimized SQL and runs it on 55,000+ campaign records.",
    color: "#9D0039",
  },
  {
    icon: BarChart3,
    title: "Smart Auto-Visualization",
    desc: "AI picks the best chart type automatically — bar, line, pie, donut, radar or table — based on what your data looks like.",
    color: "#E8005A",
  },
  {
    icon: Brain,
    title: "Business Insights",
    desc: "Every query comes with 2-3 AI-generated insights highlighting key trends, top performers, and actionable recommendations.",
    color: "#9D0039",
  },
  {
    icon: History,
    title: "Query History",
    desc: "All your queries are saved. Search, revisit, and re-run any past analysis instantly.",
    color: "#E8005A",
  },
  {
    icon: Shield,
    title: "Secure by Design",
    desc: "Only SELECT queries run. JWT authentication, bcrypt password hashing, and query validation on every single request.",
    color: "#9D0039",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    desc: "Results in milliseconds. PostgreSQL with optimized indexes on 55K records returns data faster than you can read.",
    color: "#E8005A",
  },
];

const SAMPLE_QUESTIONS = [
  "Show top 5 campaign types by total revenue",
  "Which channel has the highest average ROI?",
  "Monthly revenue trend as a line chart",
  "Compare conversions by language",
  "Best customer segments by conversion rate",
  "Donut chart of revenue by campaign type",
];

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tick,  setTick]  = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bi-theme") as "light" | "dark" | null;
      if (saved) { setTheme(saved); document.documentElement.setAttribute("data-theme", saved); }
    } catch { /* ignore */ }
    const t = setInterval(() => setTick(p => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("bi-theme", next); } catch { /* ignore */ }
  }

  const activeQ = SAMPLE_QUESTIONS[tick % SAMPLE_QUESTIONS.length];

  return (
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(24px)",
        background: "rgba(255,245,247,0.92)",
        padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(157,0,57,0.35)",
          }}>
            <Sparkles style={{ width: 20, height: 20, color: "white" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.25rem", background: "linear-gradient(135deg, #9D0039, #E8005A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Nykaa BI
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: -2 }}>Analytics Dashboard</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={toggleTheme} style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--bg-elevated)", border: "1.5px solid var(--border-default)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            {theme === "light"
              ? <Moon style={{ width: 16, height: 16, color: "var(--text-muted)" }} />
              : <Sun  style={{ width: 16, height: 16, color: "var(--text-muted)" }} />}
          </button>
          <Link href="/auth/login" style={{
            padding: "9px 20px", borderRadius: 10,
            border: "1.5px solid var(--border-default)",
            background: "var(--bg-elevated)",
            fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-secondary)",
            textDecoration: "none",
          }}>Sign In</Link>
          <Link href="/auth/register" style={{
            padding: "9px 20px", borderRadius: 10,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            fontSize: "0.9375rem", fontWeight: 600, color: "white",
            textDecoration: "none", boxShadow: "0 4px 14px rgba(157,0,57,0.30)",
          }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "80px 32px 72px", maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 16px", borderRadius: 99,
          background: "var(--brand-dim)", border: "1.5px solid var(--brand-border)",
          marginBottom: 28,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand)", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--brand)" }}>
            Powered by Google Gemini 1.5 Flash
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 900,
          fontSize: "clamp(2.75rem, 6vw, 4.25rem)",
          lineHeight: 1.06, letterSpacing: "-0.025em",
          color: "var(--text-primary)", marginBottom: 24,
        }}>
          Ask Your Nykaa Data<br />
          <span style={{ background: "linear-gradient(135deg, #9D0039, #E8005A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Anything, Instantly
          </span>
        </h1>

        <p style={{
          fontSize: "1.1875rem", color: "var(--text-muted)",
          maxWidth: 560, margin: "0 auto 40px",
          lineHeight: 1.75,
        }}>
          Type in plain English. Gemini converts it to SQL, queries 55,000+ campaign records,
          and returns beautiful charts with AI-powered business insights.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 56 }}>
          <Link href="/auth/register" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 30px", borderRadius: 13,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            color: "white", fontSize: "1.0625rem", fontWeight: 700,
            textDecoration: "none", boxShadow: "0 8px 28px rgba(157,0,57,0.32)",
          }}>
            Start Analysing Free <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
          <Link href="/auth/login" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "14px 30px", borderRadius: 13,
            background: "var(--bg-elevated)", border: "1.5px solid var(--border-default)",
            color: "var(--text-secondary)", fontSize: "1.0625rem", fontWeight: 600,
            textDecoration: "none",
          }}>
            Sign In
          </Link>
        </div>

        {/* Animated demo card */}
        <div style={{
          maxWidth: 680, margin: "0 auto",
          background: "var(--bg-card)", border: "1.5px solid var(--border-default)",
          borderRadius: 20, padding: "20px 24px",
          boxShadow: "0 8px 40px rgba(157,0,57,0.12), 0 2px 8px rgba(157,0,57,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginLeft: 6 }}>Nykaa BI — AI Chat</span>
          </div>
          <div style={{
            padding: "12px 16px", borderRadius: 12,
            background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)",
            textAlign: "left",
          }}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: 4, margin: "0 0 4px" }}>You typed:</p>
            <p style={{
              fontSize: "1rem", fontWeight: 600, color: "var(--brand)",
              fontStyle: "italic", margin: 0,
              transition: "opacity 0.3s",
              minHeight: "1.5em",
            }}>
              &ldquo;{activeQ}&rdquo;
            </p>
          </div>
          <div style={{
            marginTop: 12, padding: "10px 16px", borderRadius: 12,
            background: "var(--brand-dim)", border: "1px solid var(--brand-border)",
            display: "flex", alignItems: "center", gap: 10, textAlign: "left",
          }}>
            <Sparkles style={{ width: 16, height: 16, color: "var(--brand)", flexShrink: 0 }} />
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", margin: 0 }}>
              Gemini generates SQL → queries 55K records → renders chart + insights
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: "var(--bg-card)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "40px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 900, background: "linear-gradient(135deg, #9D0039, #E8005A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginTop: 6, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "72px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 12 }}>Features</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "clamp(1.875rem, 3.5vw, 2.625rem)", color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 14 }}>
            Everything you need for campaign analytics
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "var(--text-muted)", maxWidth: 500, margin: "0 auto" }}>
            No SQL needed. No spreadsheets. Just ask in English and get answers.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div key={i} style={{
              background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
              borderRadius: 18, padding: "24px 22px",
              boxShadow: "var(--shadow-sm)",
              transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = "0 12px 36px rgba(157,0,57,0.14)"; el.style.borderColor = "var(--brand-border)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "var(--shadow-sm)"; el.style.borderColor = "var(--border-subtle)"; }}>
              <div style={{
                width: 46, height: 46, borderRadius: 13, marginBottom: 16,
                background: "linear-gradient(135deg, rgba(157,0,57,0.12), rgba(232,0,90,0.10))",
                border: "1.5px solid var(--brand-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <f.icon style={{ width: 22, height: 22, color: f.color }} />
              </div>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: "var(--text-primary)", marginBottom: 8 }}>{f.title}</h4>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SAMPLE QUESTIONS ── */}
      <section style={{ background: "var(--bg-elevated)", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "56px 32px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--brand)", marginBottom: 12 }}>Try these</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "clamp(1.625rem, 3vw, 2.25rem)", color: "var(--text-primary)", marginBottom: 36 }}>
            Sample questions to ask
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {SAMPLE_QUESTIONS.map((q, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "14px 18px", borderRadius: 13,
                background: "var(--bg-card)", border: "1.5px solid var(--border-subtle)",
                textAlign: "left",
              }}>
                <CheckCircle2 style={{ width: 18, height: 18, color: "var(--brand)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", fontWeight: 500 }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "72px 32px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: "0 auto 28px",
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 32px rgba(157,0,57,0.35)",
          }}>
            <Sparkles style={{ width: 36, height: 36, color: "white" }} />
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "clamp(1.875rem, 3.5vw, 2.625rem)", color: "var(--text-primary)", marginBottom: 16, letterSpacing: "-0.02em" }}>
            Ready to analyse your data?
          </h2>
          <p style={{ fontSize: "1.0625rem", color: "var(--text-muted)", marginBottom: 36, lineHeight: 1.75 }}>
            Create your account in seconds and start asking questions about Nykaa&apos;s campaign performance instantly.
          </p>
          <Link href="/auth/register" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "16px 36px", borderRadius: 14,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            color: "white", fontSize: "1.125rem", fontWeight: 700,
            textDecoration: "none", boxShadow: "0 8px 32px rgba(157,0,57,0.35)",
          }}>
            Get Started Free <ArrowRight style={{ width: 20, height: 20 }} />
          </Link>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: 16, margin: "16px 0 0" }}>
            No credit card required · Free to use · Built for Nykaa
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: "1px solid var(--border-subtle)", padding: "24px 32px", textAlign: "center" }}>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>
          Built for Nykaa · Powered by Google Gemini · © 2025
        </p>
      </footer>
    </div>
  );
}