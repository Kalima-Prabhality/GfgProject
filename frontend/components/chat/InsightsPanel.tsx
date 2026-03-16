"use client";
import { Sparkles, TrendingUp } from "lucide-react";

export default function InsightsPanel({ insights }: { insights: string }) {
  const lines = insights.split("\n").map(l => l.trim()).filter(Boolean);

  return (
    <div className="rounded-xl p-4 fade-in" style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "var(--brand)" }}>
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-2xs font-bold tracking-wider uppercase" style={{ color: "var(--brand)" }}>AI Insights</span>
      </div>
      <div className="space-y-2">
        {lines.map((line, i) => {
          const isBullet = line.startsWith("•") || line.startsWith("-") || line.startsWith("*");
          const clean = isBullet ? line.slice(1).trim() : line;
          const parts = clean.split(/\*\*(.+?)\*\*/g);
          return (
            <p key={i} className={`text-sm leading-relaxed ${isBullet ? "flex gap-2" : ""}`} style={{ color: "var(--text-secondary)" }}>
              {isBullet && <TrendingUp className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "var(--brand)" }} />}
              <span>{parts.map((pt, j) => j % 2 === 1
                ? <strong key={j} style={{ color: "var(--text-primary)", fontWeight: 600 }}>{pt}</strong>
                : pt
              )}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
