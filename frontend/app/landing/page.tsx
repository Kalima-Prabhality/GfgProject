"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  MessageSquare, BarChart3, Sparkles, ArrowRight,
  Shield, Clock, TrendingUp, Brain, CheckCircle2,
  Zap, History, Sun, Moon, Database, FileText,
} from "lucide-react";

const STATS = [
  { value: "55K+", label: "Campaign Records", icon: BarChart3 },
  { value: "6",    label: "Chart Types",       icon: TrendingUp },
  { value: "Groq", label: "AI Powered",        icon: Brain },
  { value: "100%", label: "Secure Queries",    icon: Shield },
];

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Natural Language to SQL",
    desc: "Type any question in plain English. Groq AI instantly converts it to optimized SQL and runs it on 55,000+ campaign records.",
    color: "#9D0039",
    gradient: "linear-gradient(135deg, rgba(157,0,57,0.15), rgba(232,0,90,0.08))",
  },
  {
    icon: BarChart3,
    title: "Smart Auto-Visualization",
    desc: "AI picks the best chart type automatically — bar, line, pie, donut, radar or table — based on what your data looks like.",
    color: "#E8005A",
    gradient: "linear-gradient(135deg, rgba(232,0,90,0.15), rgba(255,77,143,0.08))",
  },
  {
    icon: Brain,
    title: "Business Insights",
    desc: "Every query comes with AI-generated insights highlighting key trends, top performers, and actionable recommendations.",
    color: "#9D0039",
    gradient: "linear-gradient(135deg, rgba(157,0,57,0.15), rgba(232,0,90,0.08))",
  },
  {
    icon: History,
    title: "Query History",
    desc: "All your queries are saved. Search, revisit, and re-run any past analysis instantly with full chart and insights.",
    color: "#E8005A",
    gradient: "linear-gradient(135deg, rgba(232,0,90,0.15), rgba(255,77,143,0.08))",
  },
  {
    icon: Database,
    title: "Custom CSV Upload",
    desc: "Upload any CSV file up to 1GB and chat with it instantly. AI automatically detects columns and builds queries.",
    color: "#9D0039",
    gradient: "linear-gradient(135deg, rgba(157,0,57,0.15), rgba(232,0,90,0.08))",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    desc: "Results in milliseconds. PostgreSQL with optimized indexes on 55K records returns data faster than you can read.",
    color: "#E8005A",
    gradient: "linear-gradient(135deg, rgba(232,0,90,0.15), rgba(255,77,143,0.08))",
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

const STEPS = [
  { step: "01", title: "Ask in English", desc: "Type any business question naturally — no SQL knowledge needed." },
  { step: "02", title: "AI Generates SQL", desc: "Groq converts your question to optimized PostgreSQL instantly." },
  { step: "03", title: "Get Visual Insights", desc: "Beautiful charts and AI insights appear in seconds." },
];

export default function LandingPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [tick,  setTick]  = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bi-theme") as "light" | "dark" | null;
      if (saved) { setTheme(saved); document.documentElement.setAttribute("data-theme", saved); }
    } catch { /* ignore */ }
    const t = setInterval(() => setTick(p => p + 1), 3000);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => { clearInterval(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("bi-theme", next); } catch { /* ignore */ }
  }

  const activeQ = SAMPLE_QUESTIONS[tick % SAMPLE_QUESTIONS.length];

  // Theme-aware colors
  const isDark = theme === "dark";
  const textPrimary   = isDark ? "#FFF0F4" : "#1A0009";
  const textSecondary = isDark ? "#FFBDD0" : "#3D0018";
  const textMuted     = isDark ? "#8B4565" : "#8B4060";
  const bgBase        = isDark ? "#0D0005" : "#FFF5F7";
  const bgCard        = isDark ? "#1A000C" : "#FFFFFF";
  const bgElevated    = isDark ? "#200010" : "#FFE8EE";
  const borderSubtle  = isDark ? "rgba(255,255,255,0.08)" : "rgba(157,0,57,0.14)";
  const borderDefault = isDark ? "rgba(255,200,220,0.15)" : "rgba(157,0,57,0.26)";
  const brand         = isDark ? "#FF4D8F" : "#9D0039";
  const brandDim      = isDark ? "rgba(255,77,143,0.13)" : "rgba(157,0,57,0.08)";
  const brandBorder   = isDark ? "rgba(255,77,143,0.32)" : "rgba(157,0,57,0.28)";
  const navBg         = isDark
    ? scrolled ? "rgba(13,0,5,0.96)" : "rgba(13,0,5,0.85)"
    : scrolled ? "rgba(255,255,255,0.96)" : "rgba(255,245,247,0.85)";

  return (
    <div style={{ background: bgBase, minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: textPrimary }}>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: scrolled ? `1px solid ${borderSubtle}` : "1px solid transparent",
        backdropFilter: "blur(24px) saturate(160%)",
        WebkitBackdropFilter: "blur(24px) saturate(160%)",
        background: navBg,
        padding: "0 40px", height: 68,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(157,0,57,0.35)",
          }}>
            <Sparkles style={{ width: 20, height: 20, color: "white" }} />
          </div>
          <div>
            <div style={{
              fontFamily: "'Playfair Display', serif", fontWeight: 800, fontSize: "1.25rem",
              background: "linear-gradient(135deg, #9D0039, #E8005A)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Nykaa BI
            </div>
            <div style={{ fontSize: "0.72rem", color: textMuted, marginTop: -2, letterSpacing: "0.04em" }}>
              Analytics Dashboard
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={toggleTheme} style={{
            width: 40, height: 40, borderRadius: 10,
            background: bgElevated, border: `1.5px solid ${borderDefault}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", transition: "all 0.15s",
          }}>
            {isDark
              ? <Sun  style={{ width: 16, height: 16, color: textMuted }} />
              : <Moon style={{ width: 16, height: 16, color: textMuted }} />}
          </button>
          <Link href="/auth/login" style={{
            padding: "9px 22px", borderRadius: 10,
            border: `1.5px solid ${borderDefault}`,
            background: bgElevated,
            fontSize: "0.9375rem", fontWeight: 600, color: textSecondary,
            textDecoration: "none", transition: "all 0.15s",
          }}>Sign In</Link>
          <Link href="/auth/register" style={{
            padding: "9px 22px", borderRadius: 10,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            fontSize: "0.9375rem", fontWeight: 700, color: "white",
            textDecoration: "none", boxShadow: "0 4px 16px rgba(157,0,57,0.35)",
            transition: "all 0.15s",
          }}>Get Started →</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 140, paddingBottom: 80, paddingLeft: 40, paddingRight: 40, maxWidth: 1140, margin: "0 auto", textAlign: "center" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "7px 18px", borderRadius: 99,
          background: brandDim, border: `1.5px solid ${brandBorder}`,
          marginBottom: 32,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: brand, boxShadow: `0 0 8px ${brand}`, animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: brand, letterSpacing: "0.02em" }}>
            Powered by Groq AI · 55,000+ Records
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif", fontWeight: 900,
          fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
          lineHeight: 1.05, letterSpacing: "-0.03em",
          color: textPrimary, marginBottom: 24, margin: "0 0 24px",
        }}>
          Ask Your Nykaa Data<br />
          <span style={{
            background: "linear-gradient(135deg, #9D0039 0%, #E8005A 50%, #FF4D8F 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Anything, Instantly
          </span>
        </h1>

        {/* Subheading */}
        <p style={{
          fontSize: "1.1875rem", color: textMuted,
          maxWidth: 580, margin: "0 auto 44px",
          lineHeight: 1.8, fontWeight: 400,
        }}>
          Type in plain English. Groq converts it to SQL, queries 55,000+ campaign records,
          and returns beautiful charts with AI-powered business insights — in seconds.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 64 }}>
          <Link href="/auth/register" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "15px 34px", borderRadius: 13,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            color: "white", fontSize: "1.0625rem", fontWeight: 700,
            textDecoration: "none", boxShadow: "0 8px 32px rgba(157,0,57,0.38)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(157,0,57,0.48)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(157,0,57,0.38)"; }}>
            Start Analysing Free <ArrowRight style={{ width: 18, height: 18 }} />
          </Link>
          <Link href="/auth/login" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "15px 34px", borderRadius: 13,
            background: bgCard, border: `1.5px solid ${borderDefault}`,
            color: textSecondary, fontSize: "1.0625rem", fontWeight: 600,
            textDecoration: "none", transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = brand; (e.currentTarget as HTMLElement).style.color = brand; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = borderDefault; (e.currentTarget as HTMLElement).style.color = textSecondary; }}>
            Sign In
          </Link>
        </div>

        {/* Demo Card */}
        <div style={{
          maxWidth: 700, margin: "0 auto",
          background: bgCard, border: `1.5px solid ${borderDefault}`,
          borderRadius: 24, padding: "24px 28px",
          boxShadow: isDark
            ? "0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,77,143,0.1)"
            : "0 8px 40px rgba(157,0,57,0.12), 0 2px 8px rgba(157,0,57,0.06)",
        }}>
          {/* Window dots */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#EF4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#F59E0B" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10B981" }} />
            <span style={{ fontSize: "0.8125rem", color: textMuted, marginLeft: 8, fontWeight: 500 }}>
              Nykaa BI — AI Chat
            </span>
          </div>

          {/* Animated question */}
          <div style={{
            padding: "14px 18px", borderRadius: 14,
            background: bgElevated, border: `1px solid ${borderSubtle}`,
            textAlign: "left", marginBottom: 12,
          }}>
            <p style={{ fontSize: "0.8rem", color: textMuted, marginBottom: 6, margin: "0 0 6px", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              You asked:
            </p>
            <p style={{
              fontSize: "1.0625rem", fontWeight: 600, color: brand,
              fontStyle: "italic", margin: 0, minHeight: "1.5em",
              transition: "opacity 0.4s",
            }}>
              &ldquo;{activeQ}&rdquo;
            </p>
          </div>

          {/* Response preview */}
          <div style={{
            padding: "12px 18px", borderRadius: 14,
            background: brandDim, border: `1px solid ${brandBorder}`,
            display: "flex", alignItems: "center", gap: 12, textAlign: "left",
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: "linear-gradient(135deg, #9D0039, #E8005A)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Sparkles style={{ width: 15, height: 15, color: "white" }} />
            </div>
            <p style={{ fontSize: "0.9375rem", color: textSecondary, margin: 0, fontWeight: 500 }}>
              Groq generates SQL → queries 55K records → renders chart + insights ✨
            </p>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{
        background: isDark ? "rgba(255,255,255,0.03)" : "rgba(157,0,57,0.03)",
        borderTop: `1px solid ${borderSubtle}`,
        borderBottom: `1px solid ${borderSubtle}`,
        padding: "48px 40px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 40 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "2.75rem", fontWeight: 900,
                background: "linear-gradient(135deg, #9D0039, #E8005A)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                lineHeight: 1, marginBottom: 8,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: "0.9375rem", color: textMuted, fontWeight: 600, letterSpacing: "0.02em" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 40px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: brand, marginBottom: 12 }}>
            How It Works
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 800,
            fontSize: "clamp(1.875rem, 3.5vw, 2.625rem)",
            color: textPrimary, margin: "0 0 14px",
          }}>
            Three steps to instant insights
          </h2>
          <p style={{ fontSize: "1.0625rem", color: textMuted, maxWidth: 480, margin: "0 auto" }}>
            No SQL needed. No spreadsheets. Just ask in English and get answers.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              background: bgCard, border: `1.5px solid ${borderSubtle}`,
              borderRadius: 20, padding: "32px 28px",
              boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 2px 12px rgba(157,0,57,0.08)",
              position: "relative", overflow: "hidden",
              transition: "transform 0.25s, box-shadow 0.25s",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.boxShadow = isDark ? "0 12px 40px rgba(0,0,0,0.6)" : "0 12px 36px rgba(157,0,57,0.16)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 2px 12px rgba(157,0,57,0.08)"; }}>
              <div style={{
                position: "absolute", top: 20, right: 24,
                fontFamily: "'Playfair Display', serif",
                fontSize: "4rem", fontWeight: 900, lineHeight: 1,
                color: brand, opacity: 0.08,
              }}>{s.step}</div>
              <div style={{
                width: 52, height: 52, borderRadius: 15, marginBottom: 20,
                background: "linear-gradient(135deg, #9D0039, #E8005A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 16px rgba(157,0,57,0.35)",
              }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "1.125rem", color: "white" }}>{s.step}</span>
              </div>
              <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.125rem", color: textPrimary, marginBottom: 10, margin: "0 0 10px" }}>{s.title}</h4>
              <p style={{ fontSize: "0.9375rem", color: textMuted, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(157,0,57,0.02)",
        borderTop: `1px solid ${borderSubtle}`,
        borderBottom: `1px solid ${borderSubtle}`,
        padding: "80px 40px",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: brand, marginBottom: 12 }}>
              Features
            </p>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontWeight: 800,
              fontSize: "clamp(1.875rem, 3.5vw, 2.625rem)",
              color: textPrimary, margin: "0 0 14px",
            }}>
              Everything you need for campaign analytics
            </h2>
            <p style={{ fontSize: "1.0625rem", color: textMuted, maxWidth: 500, margin: "0 auto" }}>
              Built specifically for Nykaa&apos;s marketing team with enterprise-grade features.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{
                background: bgCard, border: `1.5px solid ${borderSubtle}`,
                borderRadius: 20, padding: "28px 24px",
                boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "var(--shadow-sm)",
                transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-4px)"; el.style.borderColor = brandBorder; el.style.boxShadow = isDark ? "0 12px 40px rgba(0,0,0,0.6)" : "0 12px 36px rgba(157,0,57,0.14)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.borderColor = borderSubtle; el.style.boxShadow = isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "var(--shadow-sm)"; }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 14, marginBottom: 18,
                  background: f.gradient,
                  border: `1.5px solid ${brandBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <f.icon style={{ width: 22, height: 22, color: f.color }} />
                </div>
                <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1.0625rem", color: textPrimary, marginBottom: 10, margin: "0 0 10px" }}>{f.title}</h4>
                <p style={{ fontSize: "0.9375rem", color: textMuted, lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAMPLE QUESTIONS ── */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: brand, marginBottom: 12 }}>
            Try These
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 800,
            fontSize: "clamp(1.625rem, 3vw, 2.25rem)",
            color: textPrimary, margin: "0 0 40px",
          }}>
            Sample questions to ask
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {SAMPLE_QUESTIONS.map((q, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px 20px", borderRadius: 14,
                background: bgCard, border: `1.5px solid ${borderSubtle}`,
                textAlign: "left", transition: "all 0.2s",
                cursor: "default",
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = brandBorder; el.style.background = brandDim; el.style.transform = "translateX(4px)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = borderSubtle; el.style.background = bgCard; el.style.transform = "none"; }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                  background: brandDim, border: `1px solid ${brandBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CheckCircle2 style={{ width: 16, height: 16, color: brand }} />
                </div>
                <span style={{ fontSize: "0.9375rem", color: textSecondary, fontWeight: 500, lineHeight: 1.5 }}>{q}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: isDark ? "rgba(255,255,255,0.02)" : "rgba(157,0,57,0.03)",
        borderTop: `1px solid ${borderSubtle}`,
        padding: "88px 40px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, margin: "0 auto 32px",
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 12px 40px rgba(157,0,57,0.40)",
            animation: "float 3s ease-in-out infinite",
          }}>
            <Sparkles style={{ width: 38, height: 38, color: "white" }} />
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontWeight: 800,
            fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)",
            color: textPrimary, margin: "0 0 18px", letterSpacing: "-0.02em",
          }}>
            Ready to analyse your data?
          </h2>
          <p style={{ fontSize: "1.125rem", color: textMuted, margin: "0 0 40px", lineHeight: 1.8 }}>
            Create your account in seconds and start asking questions about Nykaa&apos;s
            campaign performance instantly. No credit card required.
          </p>
          <Link href="/auth/register" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            padding: "17px 40px", borderRadius: 14,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            color: "white", fontSize: "1.125rem", fontWeight: 700,
            textDecoration: "none", boxShadow: "0 8px 36px rgba(157,0,57,0.40)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 14px 48px rgba(157,0,57,0.50)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 36px rgba(157,0,57,0.40)"; }}>
            Get Started Free <ArrowRight style={{ width: 20, height: 20 }} />
          </Link>
          <p style={{ fontSize: "0.875rem", color: textMuted, marginTop: 16 }}>
            No credit card required · Free to use · Built for Nykaa
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${borderSubtle}`,
        padding: "28px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #9D0039, #E8005A)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Sparkles style={{ width: 13, height: 13, color: "white" }} />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1rem", color: brand }}>
            Nykaa BI
          </span>
        </div>
        <p style={{ fontSize: "0.875rem", color: textMuted, margin: 0 }}>
          Built for Nykaa · Powered by Groq · © 2026
        </p>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/auth/login" style={{ fontSize: "0.875rem", color: textMuted, textDecoration: "none" }}>Sign In</Link>
          <Link href="/auth/register" style={{ fontSize: "0.875rem", color: brand, textDecoration: "none", fontWeight: 600 }}>Get Started</Link>
        </div>
      </footer>
    </div>
  );
}