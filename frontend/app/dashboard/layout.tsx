"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare, History, Lightbulb, LogOut,
  ChevronLeft, ChevronRight, User, Sparkles, Sun, Moon,
} from "lucide-react";
import { getUser, clearAuth, isAuthenticated } from "@/lib/auth";
import { useTheme, ThemeProvider } from "@/lib/theme";

const NAV = [
  { href: "/dashboard",          icon: MessageSquare, label: "AI Chat"  },
  { href: "/dashboard/history",  icon: History,       label: "History"  },
  { href: "/dashboard/insights", icon: Lightbulb,     label: "Insights" },
];

function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted,   setMounted]   = useState(false);
  const [user,      setUser]      = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) { router.push("/landing"); return; }
    try { const u = getUser(); if (u) setUser(u); } catch { /* ignore */ }
  }, [router]);

  if (!mounted) return (
    <aside style={{ width: 240, flexShrink: 0, background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-subtle)", height: "100vh" }} />
  );

  const W = collapsed ? 68 : 240;

  return (
    <aside style={{
      width: W, flexShrink: 0,
      background: "var(--bg-sidebar)",
      borderRight: "1px solid var(--border-subtle)",
      height: "100vh", position: "sticky", top: 0,
      display: "flex", flexDirection: "column",
      transition: "width 0.25s ease",
      overflow: "visible", zIndex: 40,
    }}>

      {/* Logo */}
      <div style={{
        height: 64, display: "flex", alignItems: "center",
        padding: collapsed ? "0 16px" : "0 20px",
        gap: 12, borderBottom: "1px solid var(--border-subtle)",
        flexShrink: 0, overflow: "hidden",
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "linear-gradient(135deg, #9D0039, #E8005A)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 12px rgba(157,0,57,0.35)",
        }}>
          <Sparkles style={{ width: 18, height: 18, color: "white" }} />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 800, fontSize: "1.1875rem",
              background: "linear-gradient(135deg, #9D0039, #E8005A)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              whiteSpace: "nowrap",
            }}>Nykaa BI</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Analytics Dashboard
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center",
              gap: 12, padding: collapsed ? "12px 0" : "12px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 11, textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "1rem", fontWeight: active ? 600 : 500,
              color: active ? "#9D0039" : "var(--text-secondary)",
              background: active ? "rgba(157,0,57,0.08)" : "transparent",
              boxShadow: active ? "inset 3px 0 0 #9D0039" : "none",
              transition: "all 0.15s", whiteSpace: "nowrap",
            }}
            title={collapsed ? item.label : undefined}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; } }}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; } }}>
              <item.icon style={{ width: 18, height: 18, flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "10px 10px 16px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: 3 }}>
        <button onClick={toggle} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: collapsed ? "12px 0" : "12px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 11, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", fontWeight: 500,
          color: "var(--text-secondary)", background: "transparent", border: "none", width: "100%",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          {theme === "light" ? <Moon style={{ width: 18, height: 18, flexShrink: 0 }} /> : <Sun style={{ width: 18, height: 18, flexShrink: 0 }} />}
          {!collapsed && <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>}
        </button>

        {!collapsed && user && (
          <div style={{ padding: "10px 12px", borderRadius: 11, background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", margin: "2px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #9D0039, #E8005A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User style={{ width: 16, height: 16, color: "white" }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <button onClick={() => { clearAuth(); router.push("/landing"); }} style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: collapsed ? "12px 0" : "12px 14px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: 11, cursor: "pointer",
          fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", fontWeight: 500,
          color: "var(--red)", background: "transparent", border: "none", width: "100%",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
          <LogOut style={{ width: 18, height: 18, flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button onClick={() => setCollapsed(!collapsed)} style={{
        position: "absolute", right: -14, top: 84,
        width: 28, height: 28, borderRadius: "50%",
        background: "var(--bg-card)", border: "1.5px solid var(--border-default)",
        boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: "pointer", zIndex: 50,
        transition: "transform 0.15s",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.15)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}>
        {collapsed ? <ChevronRight style={{ width: 14, height: 14, color: "var(--text-muted)" }} /> : <ChevronLeft style={{ width: 14, height: 14, color: "var(--text-muted)" }} />}
      </button>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base)" }}>
        <Sidebar />
        <main style={{ flex: 1, overflow: "hidden", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}