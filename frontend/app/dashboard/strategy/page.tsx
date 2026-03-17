"use client";
import { useState, useEffect } from "react";
import {
  Plus, X, ChevronRight, TrendingUp, Target, Zap,
  CheckCircle2, Clock, ArrowRight, BarChart2,
  Lightbulb, Flag, Sparkles, Pencil, Check,
} from "lucide-react";

interface StrategyCard {
  id: string;
  title: string;
  description: string;
  impact: "High" | "Medium" | "Low";
  effort: "High" | "Medium" | "Low";
  category: "Revenue" | "ROI" | "Engagement" | "Acquisition" | "Retention";
  metric?: string;
  action: string;
  column: "priority" | "inprogress" | "done";
}

interface Column {
  id: "priority" | "inprogress" | "done";
  title: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  emptyText: string;
}

const COLUMNS: Column[] = [
  { id: "priority",   title: "🎯 Priority",   icon: Flag,         color: "#E8005A", bg: "rgba(232,0,90,0.06)",  border: "rgba(232,0,90,0.20)",  emptyText: "High impact opportunities" },
  { id: "inprogress", title: "⚡ In Progress", icon: Zap,          color: "#9D0039", bg: "rgba(157,0,57,0.06)",  border: "rgba(157,0,57,0.20)",  emptyText: "Active optimizations" },
  { id: "done",       title: "✅ Done",        icon: CheckCircle2, color: "#047857", bg: "rgba(4,120,87,0.06)",  border: "rgba(4,120,87,0.20)",  emptyText: "Completed wins" },
];

const IMPACT_COLORS = {
  High:   { color: "#E8005A", bg: "rgba(232,0,90,0.10)",  border: "rgba(232,0,90,0.25)"  },
  Medium: { color: "#B45309", bg: "rgba(180,83,9,0.10)",  border: "rgba(180,83,9,0.25)"  },
  Low:    { color: "#047857", bg: "rgba(4,120,87,0.10)",  border: "rgba(4,120,87,0.25)"  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Revenue:     TrendingUp,
  ROI:         BarChart2,
  Engagement:  Zap,
  Acquisition: Target,
  Retention:   CheckCircle2,
};

const DEFAULT_CARDS: StrategyCard[] = [
  {
    id: "1", column: "priority", title: "Scale Influencer Campaigns",
    description: "Influencer campaigns drive the highest revenue at ₹5.76B. Scaling budget by 20% could yield significant returns.",
    impact: "High", effort: "Medium", category: "Revenue", metric: "₹5.76B revenue",
    action: "Increase influencer campaign budget by 20% for Q2 2025.",
  },
  {
    id: "2", column: "priority", title: "Optimize Google Ads ROI",
    description: "Google channel shows strong ROI potential but underutilized compared to Instagram.",
    impact: "High", effort: "Low", category: "ROI", metric: "3.2x avg ROI",
    action: "Reallocate 15% of Facebook budget to Google Ads.",
  },
  {
    id: "3", column: "priority", title: "Target Working Women Segment",
    description: "Working Women audience shows highest conversion rates across all campaign types.",
    impact: "Medium", effort: "Low", category: "Acquisition", metric: "42% conversion rate",
    action: "Launch dedicated Working Women campaign on Instagram and YouTube.",
  },
  {
    id: "4", column: "inprogress", title: "Hindi Language Campaigns",
    description: "Hindi campaigns outperform English by 18% in Tier 2 cities. Expanding content.",
    impact: "Medium", effort: "Medium", category: "Engagement", metric: "18% better CTR",
    action: "Create Hindi-first content for WhatsApp and YouTube channels.",
  },
  {
    id: "5", column: "inprogress", title: "Reduce Acquisition Cost",
    description: "Average acquisition cost needs optimization. Email campaigns show lowest cost.",
    impact: "High", effort: "High", category: "Acquisition", metric: "₹245 avg cost",
    action: "A/B test email subject lines and reduce CPC on paid ads.",
  },
  {
    id: "6", column: "done", title: "YouTube Campaign Launch",
    description: "Successfully launched YouTube influencer campaigns with 4.1x ROI.",
    impact: "High", effort: "High", category: "ROI", metric: "4.1x ROI achieved",
    action: "Completed — maintain monthly YouTube campaign cadence.",
  },
  {
    id: "7", column: "done", title: "Social Media Automation",
    description: "Automated social media posting schedule achieving consistent engagement.",
    impact: "Medium", effort: "Low", category: "Engagement", metric: "+23% engagement",
    action: "Completed — review automation rules quarterly.",
  },
];

// ── Card Component ──────────────────────────────────────────
function StrategyCardComponent({
  card, onMove, onDelete, onEdit,
}: {
  card: StrategyCard;
  onMove: (id: string, dir: "left" | "right") => void;
  onDelete: (id: string) => void;
  onEdit: (card: StrategyCard) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const impact = IMPACT_COLORS[card.impact];
  const CategoryIcon = CATEGORY_ICONS[card.category] || Lightbulb;
  const colIdx = COLUMNS.findIndex(c => c.id === card.column);

  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1.5px solid var(--border-subtle)",
      borderRadius: 16, padding: "16px",
      boxShadow: "var(--shadow-sm)",
      transition: "all 0.22s ease", cursor: "pointer",
    }}
    onClick={() => setExpanded(!expanded)}
    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "translateY(-3px)"; el.style.boxShadow = "var(--shadow-md)"; el.style.borderColor = "var(--brand-border)"; }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = "none"; el.style.boxShadow = "var(--shadow-sm)"; el.style.borderColor = "var(--border-subtle)"; }}>

      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: impact.bg, border: `1px solid ${impact.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CategoryIcon style={{ width: 15, height: 15, color: impact.color }} />
          </div>
          <span style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.07em", textTransform: "uppercase", color: impact.color, background: impact.bg, padding: "2px 8px", borderRadius: 99, border: `1px solid ${impact.border}` }}>
            {card.impact}
          </span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(card); }} style={{ width: 26, height: 26, borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", cursor: "pointer", color: "var(--brand)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--brand-dim)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}>
            <Pencil style={{ width: 11, height: 11 }} />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(card.id); }} style={{ width: 26, height: 26, borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", cursor: "pointer", color: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--red-dim)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-elevated)"; }}>
            <X style={{ width: 11, height: 11 }} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: 8 }}>
        {card.title}
      </p>

      {/* Category + metric */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "2px 8px", borderRadius: 99, border: "1px solid var(--border-subtle)" }}>
          {card.category}
        </span>
        {card.metric && (
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--brand)", background: "var(--brand-dim)", padding: "2px 8px", borderRadius: 99, border: "1px solid var(--brand-border)" }}>
            {card.metric}
          </span>
        )}
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
          {card.description && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 10 }}>
              {card.description}
            </p>
          )}
          {card.action && (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: "linear-gradient(135deg, rgba(157,0,57,0.08), rgba(232,0,90,0.04))", border: "1px solid var(--brand-border)" }}>
              <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--brand)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Action</p>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{card.action}</p>
            </div>
          )}
          <span style={{ display: "inline-block", marginTop: 8, fontSize: "0.72rem", fontWeight: 600, color: "var(--text-muted)", background: "var(--bg-elevated)", padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-subtle)" }}>
            Effort: {card.effort}
          </span>
        </div>
      )}

      {/* Move buttons */}
      <div style={{ display: "flex", gap: 6, marginTop: 12, justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {colIdx > 0 && (
            <button onClick={e => { e.stopPropagation(); onMove(card.id, "left"); }} style={{ padding: "4px 10px", borderRadius: 7, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "var(--brand)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-default)"; }}>
              ← Back
            </button>
          )}
          {colIdx < COLUMNS.length - 1 && (
            <button onClick={e => { e.stopPropagation(); onMove(card.id, "right"); }} style={{ padding: "4px 10px", borderRadius: 7, background: "var(--brand-dim)", border: "1px solid var(--brand-border)", fontSize: "0.75rem", fontWeight: 600, color: "var(--brand)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, transition: "all 0.15s" }}>
              Move <ArrowRight style={{ width: 11, height: 11 }} />
            </button>
          )}
        </div>
        <ChevronRight style={{ width: 14, height: 14, color: "var(--text-muted)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </div>
    </div>
  );
}

// ── Card Form Modal ─────────────────────────────────────────
function CardModal({ card, column, onSave, onClose }: {
  card?: StrategyCard;
  column: "priority" | "inprogress" | "done";
  onSave: (card: StrategyCard) => void;
  onClose: () => void;
}) {
  const [title,       setTitle]       = useState(card?.title || "");
  const [description, setDescription] = useState(card?.description || "");
  const [action,      setAction]      = useState(card?.action || "");
  const [metric,      setMetric]      = useState(card?.metric || "");
  const [impact,      setImpact]      = useState<StrategyCard["impact"]>(card?.impact || "Medium");
  const [effort,      setEffort]      = useState<StrategyCard["effort"]>(card?.effort || "Medium");
  const [category,    setCategory]    = useState<StrategyCard["category"]>(card?.category || "Revenue");

  function handleSave() {
    if (!title.trim()) return;
    onSave({
      id:          card?.id || Math.random().toString(36).slice(2),
      title, description, action,
      metric:      metric || undefined,
      impact, effort, category,
      column:      card?.column || column,
    });
    onClose();
  }

  const isEdit = !!card;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, backdropFilter: "blur(6px)" }}
      onClick={onClose}>
      <div style={{ background: "var(--bg-card)", borderRadius: 22, padding: "28px", width: 500, maxWidth: "95vw", boxShadow: "var(--shadow-lg)", border: "1.5px solid var(--border-subtle)", maxHeight: "90vh", overflowY: "auto" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #9D0039, #E8005A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isEdit ? <Pencil style={{ width: 16, height: 16, color: "white" }} /> : <Plus style={{ width: 16, height: 16, color: "white" }} />}
            </div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {isEdit ? "Edit Card" : "New Strategy Card"}
            </h3>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-muted)" }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Scale Instagram Influencer Campaigns" className="input-pro" style={{ fontSize: "0.9375rem" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What insight supports this strategy?" className="input-pro" rows={3} style={{ resize: "none", fontSize: "0.9375rem" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Action to Take</label>
            <input value={action} onChange={e => setAction(e.target.value)} placeholder="Specific action step" className="input-pro" style={{ fontSize: "0.9375rem" }} />
          </div>
          <div>
            <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Key Metric</label>
            <input value={metric} onChange={e => setMetric(e.target.value)} placeholder="e.g. ₹5.7B revenue, 4.1x ROI" className="input-pro" style={{ fontSize: "0.9375rem" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Impact</label>
              <select value={impact} onChange={e => setImpact(e.target.value as StrategyCard["impact"])} className="input-pro" style={{ fontSize: "0.875rem" }}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Effort</label>
              <select value={effort} onChange={e => setEffort(e.target.value as StrategyCard["effort"])} className="input-pro" style={{ fontSize: "0.875rem" }}>
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value as StrategyCard["category"])} className="input-pro" style={{ fontSize: "0.875rem" }}>
                <option>Revenue</option><option>ROI</option><option>Engagement</option><option>Acquisition</option><option>Retention</option>
              </select>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: 12, background: "var(--bg-elevated)", border: "1.5px solid var(--border-default)", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "0.9375rem" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!title.trim()} style={{ flex: 1, padding: "12px", borderRadius: 12, background: !title.trim() ? "var(--bg-elevated)" : "linear-gradient(135deg, #9D0039, #E8005A)", border: "none", color: !title.trim() ? "var(--text-muted)" : "white", fontWeight: 700, cursor: !title.trim() ? "not-allowed" : "pointer", fontSize: "0.9375rem", boxShadow: !title.trim() ? "none" : "0 4px 14px rgba(157,0,57,0.30)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Check style={{ width: 15, height: 15 }} />
            {isEdit ? "Save Changes" : "Add Card"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function StrategyBoardPage() {
  const [cards, setCards]       = useState<StrategyCard[]>(DEFAULT_CARDS);
  const [addingTo, setAddingTo] = useState<"priority" | "inprogress" | "done" | null>(null);
  const [editing, setEditing]   = useState<StrategyCard | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nykaa-strategy-cards");
      if (saved) setCards(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem("nykaa-strategy-cards", JSON.stringify(cards)); } catch { /* ignore */ }
  }, [cards]);

  function moveCard(id: string, dir: "left" | "right") {
    setCards(prev => prev.map(c => {
      if (c.id !== id) return c;
      const idx = COLUMNS.findIndex(col => col.id === c.column);
      const newIdx = dir === "left" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= COLUMNS.length) return c;
      return { ...c, column: COLUMNS[newIdx].id };
    }));
  }

  function deleteCard(id: string) {
    setCards(prev => prev.filter(c => c.id !== id));
  }

  function saveCard(card: StrategyCard) {
    setCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) return prev.map(c => c.id === card.id ? card : c);
      return [...prev, card];
    });
  }

  const totalCards = cards.length;
  const doneCards  = cards.filter(c => c.column === "done").length;
  const progress   = totalCards > 0 ? Math.round((doneCards / totalCards) * 100) : 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-base)" }}>

      {/* ── Header ── */}
      <div style={{ flexShrink: 0, height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-surface)", boxShadow: "0 1px 0 var(--border-subtle), 0 4px 16px rgba(157,0,57,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "linear-gradient(135deg, #9D0039, #E8005A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(157,0,57,0.35)" }}>
            <Target style={{ width: 20, height: 20, color: "white" }} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              Nykaa Strategy Board
            </h1>
            <p style={{ fontSize: "0.775rem", color: "var(--text-muted)", margin: 0, fontWeight: 500 }}>
              Marketing strategy · Kanban board
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Progress bar */}
          {totalCards > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 130, height: 7, borderRadius: 99, background: "var(--bg-elevated)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                <div style={{ height: "100%", width: `${progress}%`, borderRadius: 99, background: "linear-gradient(90deg, #9D0039, #E8005A)", transition: "width 0.4s ease" }} />
              </div>
              <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--brand)", minWidth: 60 }}>{progress}% done</span>
            </div>
          )}

          {/* Column stats */}
          <div style={{ display: "flex", gap: 8 }}>
            {COLUMNS.map(col => {
              const count = cards.filter(c => c.column === col.id).length;
              return (
                <div key={col.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 99, background: col.bg, border: `1px solid ${col.border}` }}>
                  <col.icon style={{ width: 12, height: 12, color: col.color }} />
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: col.color }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Board ── */}
      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "24px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, minWidth: 900, height: "100%" }}>
          {COLUMNS.map(col => {
            const colCards = cards.filter(c => c.column === col.id);
            return (
              <div key={col.id} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>

                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "10px 16px", borderRadius: 14, background: col.bg, border: `1.5px solid ${col.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <col.icon style={{ width: 16, height: 16, color: col.color }} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: col.color }}>
                      {col.title}
                    </span>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: col.color, color: "white", fontSize: "0.72rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {colCards.length}
                    </span>
                  </div>
                  <button onClick={() => setAddingTo(col.id)} style={{ width: 30, height: 30, borderRadius: 8, background: "white", border: `1.5px solid ${col.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: col.color, transition: "all 0.15s", boxShadow: "var(--shadow-sm)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = col.bg; (e.currentTarget as HTMLElement).style.transform = "scale(1.1)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "white"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                    <Plus style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                {/* Cards list */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 8, paddingRight: 2 }}>
                  {colCards.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "36px 16px", borderRadius: 14, border: `2px dashed ${col.border}`, color: "var(--text-muted)", cursor: "pointer", transition: "all 0.15s" }}
                      onClick={() => setAddingTo(col.id)}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = col.bg; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                      <col.icon style={{ width: 28, height: 28, margin: "0 auto 10px", opacity: 0.3, color: col.color }} />
                      <p style={{ fontSize: "0.875rem", margin: "0 0 4px", fontWeight: 600 }}>No cards yet</p>
                      <p style={{ fontSize: "0.775rem", margin: 0, opacity: 0.7 }}>{col.emptyText}</p>
                      <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 99, background: col.bg, border: `1px solid ${col.border}`, color: col.color, fontSize: "0.775rem", fontWeight: 600 }}>
                        <Plus style={{ width: 12, height: 12 }} /> Add card
                      </div>
                    </div>
                  ) : (
                    colCards.map(card => (
                      <StrategyCardComponent
                        key={card.id}
                        card={card}
                        onMove={moveCard}
                        onDelete={deleteCard}
                        onEdit={setEditing}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ flexShrink: 0, padding: "10px 28px", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Clock style={{ width: 13, height: 13, color: "var(--text-muted)" }} />
          <span style={{ fontSize: "0.775rem", color: "var(--text-muted)" }}>
            {totalCards} strategies · {doneCards} completed · {totalCards - doneCards} remaining
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles style={{ width: 12, height: 12, color: "var(--brand)" }} />
          <span style={{ fontSize: "0.775rem", color: "var(--brand)", fontWeight: 600 }}>
            Nykaa BI Strategy Board
          </span>
        </div>
      </div>

      {/* ── Modals ── */}
      {addingTo && (
        <CardModal
          column={addingTo}
          onSave={saveCard}
          onClose={() => setAddingTo(null)}
        />
      )}
      {editing && (
        <CardModal
          card={editing}
          column={editing.column}
          onSave={saveCard}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}