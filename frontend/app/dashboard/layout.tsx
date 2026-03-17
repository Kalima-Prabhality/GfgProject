"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare, History, Upload, LogOut,
  ChevronLeft, ChevronRight, User, Sparkles, Sun, Moon,
  BarChart3,
} from "lucide-react";
import { getUser, clearAuth, isAuthenticated } from "@/lib/auth";
import { useTheme, ThemeProvider } from "@/lib/theme";

const NAV = [
  { href: "/dashboard",         icon: MessageSquare, label: "AI Chat",  desc: "Ask your data" },
  { href: "/dashboard/history", icon: History,       label: "History",  desc: "Past queries"  },
  { href: "/dashboard/upload",  icon: Upload,        label: "Datasets", desc: "Upload CSV"    },
];

function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [user,      setUser]      = useState<{ name: string; email: string } | null>(null);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) { router.push("/landing"); return; }
    try { const u = getUser(); if (u) setUser(u); } catch { /* ignore */ }
  }, [router]);

  if (!mounted) return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-subtle)",
      height: "100vh",
    }} />
  );

  const W = collapsed ? 72 : 260;
  const isDark = theme === "dark";

  return (
    <aside style={{
      width: W, flexShrink: 0,
      background: isDark
        ? "linear-gradient(180deg, #0F0008 0%, #080003 100%)"
        : "linear-gradient(180deg, #FFFFFF 0%, #FDF2F5 100%)",
      borderRight: `1px solid ${isDark ? "rgba(255,77,143,0.10)" : "rgba(157,0,57,0.10)"}`,
      height: "100vh",
      position: "sticky", top: 0,
      display: "flex", flexDirection: "column",
      transition: "width 0.28s cubic-bezier(0.4,0,0.2,1)",
      overflow: "visible", zIndex: 40,
      boxShadow: isDark
        ? "4px 0 24px rgba(0,0,0,0.4)"
        : "4px 0 24px rgba(157,0,57,0.06)",
    }}>

      {/* ── Logo ── */}
      <div style={{
        height: 72,
        display: "flex", alignItems: "center",
        padding: collapsed ? "0 18px" : "0 22px",
        gap: 14,
        borderBottom: `1px solid ${isDark ? "rgba(255,77,143,0.08)" : "rgba(157,0,57,0.08)"}`,
        flexShrink: 0,
        overflow: "hidden",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: "linear-gradient(135deg, #9D0039 0%, #E8005A 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(157,0,57,0.40)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = "scale(1.08) rotate(-5deg)"}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = "none"}>
          <Sparkles style={{ width: 20, height: 20, color: "white" }} />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 800, fontSize: "1.25rem",
              background: "linear-gradient(135deg, #9D0039, #E8005A)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              whiteSpace: "nowrap", letterSpacing: "-0.01em",
            }}>Nykaa BI</div>
            <div style={{
              fontSize: "0.72rem", color: "var(--text-muted)",
              whiteSpace: "nowrap", letterSpacing: "0.06em",
              textTransform: "uppercase", fontWeight: 600,
            }}>
              Analytics Dashboard
            </div>
          </div>
        )}
      </div>

      {/* ── Nav label ── */}
      {!collapsed && (
        <div style={{
          padding: "16px 22px 8px",
          fontSize: "0.68rem", fontWeight: 800,
          letterSpacing: "0.12em", textTransform: "uppercase",
          color: "var(--text-muted)",
        }}>
          Navigation
        </div>
      )}

      {/* ── Nav Items ── */}
      <nav style={{
        flex: 1,
        padding: collapsed ? "12px 10px" : "4px 12px",
        display: "flex", flexDirection: "column", gap: 4,
        overflowY: "auto",
      }}>
        {NAV.map(item => {
          const active = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const hovered = hoveredNav === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              onMouseEnter={() => setHoveredNav(item.href)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                display: "flex", alignItems: "center",
                gap: 12,
                padding: collapsed ? "13px 0" : "12px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                borderRadius: 12, textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9375rem",
                fontWeight: active ? 700 : 500,
                color: active
                  ? isDark ? "#FF4D8F" : "#9D0039"
                  : "var(--text-secondary)",
                background: active
                  ? isDark ? "rgba(255,77,143,0.12)" : "rgba(157,0,57,0.08)"
                  : hovered
                  ? isDark ? "rgba(255,77,143,0.06)" : "rgba(157,0,57,0.05)"
                  : "transparent",
                boxShadow: active
                  ? `inset 3px 0 0 ${isDark ? "#FF4D8F" : "#9D0039"}`
                  : "none",
                transition: "all 0.18s ease",
                position: "relative",
              }}>

              {/* Icon container */}
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active
                  ? isDark ? "rgba(255,77,143,0.18)" : "rgba(157,0,57,0.12)"
                  : hovered
                  ? isDark ? "rgba(255,77,143,0.10)" : "rgba(157,0,57,0.07)"
                  : "transparent",
                transition: "all 0.18s ease",
              }}>
                <item.icon style={{
                  width: 17, height: 17,
                  color: active
                    ? isDark ? "#FF4D8F" : "#9D0039"
                    : "var(--text-muted)",
                  transition: "color 0.18s",
                }} />
              </div>

              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ lineHeight: 1.2 }}>{item.label}</div>
                  {!active && (
                    <div style={{
                      fontSize: "0.75rem", color: "var(--text-muted)",
                      fontWeight: 400, marginTop: 1,
                    }}>{item.desc}</div>
                  )}
                </div>
              )}

              {/* Active dot */}
              {active && !collapsed && (
                <div style={{
                  width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
                  background: isDark ? "#FF4D8F" : "#9D0039",
                  boxShadow: `0 0 8px ${isDark ? "#FF4D8F" : "#9D0039"}`,
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div style={{
        height: 1, margin: "0 16px",
        background: isDark
          ? "rgba(255,77,143,0.08)"
          : "rgba(157,0,57,0.08)",
      }} />

      {/* ── Bottom section ── */}
      <div style={{
        padding: collapsed ? "12px 10px" : "12px",
        display: "flex", flexDirection: "column", gap: 4,
      }}>

        {/* Theme toggle */}
        <button onClick={toggle} style={{
          display: "flex", alignItems: "center",
          gap: 12, padding: collapsed ? "12px 0" : "11px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 12, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.9375rem", fontWeight: 500,
          color: "var(--text-secondary)",
          background: "transparent", border: "none", width: "100%",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background =
            isDark ? "rgba(255,77,143,0.06)" : "rgba(157,0,57,0.05)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          }}>
            {isDark
              ? <Sun  style={{ width: 16, height: 16, color: "#FCD34D" }} />
              : <Moon style={{ width: 16, height: 16, color: "#6366F1" }} />}
          </div>
          {!collapsed && (
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          )}
        </button>

        {/* User card */}
        {!collapsed && user && (
          <div style={{
            padding: "12px 14px", borderRadius: 12,
            background: isDark ? "rgba(255,77,143,0.07)" : "rgba(157,0,57,0.05)",
            border: `1px solid ${isDark ? "rgba(255,77,143,0.12)" : "rgba(157,0,57,0.10)"}`,
            margin: "4px 0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #9D0039, #E8005A)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(157,0,57,0.30)",
              }}>
                <User style={{ width: 16, height: 16, color: "white" }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontSize: "0.9rem", fontWeight: 700,
                  color: "var(--text-primary)",
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", margin: 0,
                }}>{user.name}</p>
                <p style={{
                  fontSize: "0.75rem", color: "var(--text-muted)",
                  overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap", margin: 0,
                }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button onClick={() => { clearAuth(); router.push("/landing"); }} style={{
          display: "flex", alignItems: "center",
          gap: 12, padding: collapsed ? "12px 0" : "11px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 12, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.9375rem", fontWeight: 500,
          color: "var(--red)",
          background: "transparent", border: "none", width: "100%",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = "var(--red-dim)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--red-dim)",
            border: "1px solid rgba(185,28,28,0.15)",
          }}>
            <LogOut style={{ width: 16, height: 16, color: "var(--red)" }} />
          </div>
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Version tag */}
        {!collapsed && (
          <div style={{
            textAlign: "center", padding: "8px 0 4px",
            fontSize: "0.7rem", color: "var(--text-muted)",
            letterSpacing: "0.05em", opacity: 0.6,
          }}>
            Nykaa BI v2.0 · Powered by Groq
          </div>
        )}
      </div>

      {/* ── Collapse button ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: "absolute", right: -14, top: 88,
          width: 28, height: 28, borderRadius: "50%",
          background: isDark ? "#1A000C" : "#FFFFFF",
          border: `1.5px solid ${isDark ? "rgba(255,77,143,0.20)" : "rgba(157,0,57,0.20)"}`,
          boxShadow: isDark
            ? "0 2px 12px rgba(0,0,0,0.5)"
            : "0 2px 12px rgba(157,0,57,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 50,
          transition: "all 0.18s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background =
            "linear-gradient(135deg, #9D0039, #E8005A)";
          (e.currentTarget as HTMLElement).style.transform = "scale(1.15)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = isDark ? "#1A000C" : "#FFFFFF";
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        }}>
        {collapsed
          ? <ChevronRight style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
          : <ChevronLeft  style={{ width: 13, height: 13, color: "var(--text-muted)" }} />}
      </button>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div style={{
        display: "flex", height: "100vh",
        overflow: "hidden", background: "var(--bg-base)",
      }}>
        <Sidebar />
        <main style={{
          flex: 1, overflow: "hidden",
          minWidth: 0, display: "flex",
          flexDirection: "column",
        }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}