"use client";
import { User, Bot, Clock, BarChart2, Zap, AlertCircle } from "lucide-react";
import dynamic from "next/dynamic";
import type { Props as ChartRendererProps } from "@/components/charts/ChartRenderer";
import SqlViewer from "@/components/chat/SqlViewer";
import InsightsPanel from "@/components/chat/InsightsPanel";
import type { ChatMessage } from "@/types";
import { formatDistanceToNow } from "date-fns";

const ChartRenderer = dynamic<ChartRendererProps>(() => import("@/components/charts/ChartRenderer"), { ssr: false });

const chartTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
  bar:      { label: "Bar Chart",     color: "var(--brand)",   bg: "var(--brand-dim)" },
  line:     { label: "Line Chart",    color: "var(--cyan)",    bg: "var(--cyan-dim)" },
  area:     { label: "Area Chart",    color: "var(--cyan)",    bg: "var(--cyan-dim)" },
  pie:      { label: "Pie Chart",     color: "var(--accent)",  bg: "var(--accent-dim)" },
  doughnut: { label: "Donut Chart",   color: "var(--accent)",  bg: "var(--accent-dim)" },
  radar:    { label: "Radar Chart",   color: "var(--emerald)", bg: "var(--emerald-dim)" },
  table:    { label: "Data Table",    color: "var(--amber)",   bg: "var(--amber-dim)" },
};

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-3 fade-up">
        <div className="max-w-xl">
          <div className="chat-bubble-user">{message.content}</div>
          <p className="text-right text-2xs mt-1 pr-1" style={{ color: "var(--text-muted)" }}>
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </p>
        </div>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
          <User className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 fade-up">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
        <Bot className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
      </div>

      <div className="flex-1 max-w-4xl space-y-3">
        {/* Loading */}
        {message.loading && (
          <div className="card-pro p-4">
            <div className="flex items-center gap-3" style={{ color: "var(--text-muted)" }}>
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--brand)", animation: "typingDot 1.2s ease-in-out infinite", animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
              <span className="text-sm">Analyzing your question...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {message.error && (
          <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--red)" }} />
            <span style={{ color: "var(--red)" }}>{message.error}</span>
          </div>
        )}

        {/* Response */}
        {message.response && !message.loading && (
          <>
            {/* Meta bar */}
            <div className="flex items-center gap-3 flex-wrap">
              {(() => {
                const ct = chartTypeLabels[message.response.chart_type] || chartTypeLabels.table;
                return (
                  <span className="badge" style={{ background: ct.bg, color: ct.color, border: `1px solid ${ct.color}30` }}>
                    <BarChart2 className="w-2.5 h-2.5" />{ct.label}
                  </span>
                );
              })()}
              <span className="text-2xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Zap className="w-3 h-3" />{message.response.row_count} rows
              </span>
              <span className="text-2xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                <Clock className="w-3 h-3" />{message.response.execution_time_ms.toFixed(0)}ms
              </span>
              {message.response.csv_name && (
                <span className="badge badge-emerald">{message.response.csv_name}</span>
              )}
            </div>

            {/* Chart */}
            {(message.response.chart_data || message.response.table_data) && (
              <div className="card-pro p-4">
                <ChartRenderer
                  chartType={message.response.chart_type}
                  chartData={message.response.chart_data}
                  tableData={message.response.table_data}
                  historyId={message.response.history_id}
                />
              </div>
            )}

            {/* Insights */}
            {message.response.insights && <InsightsPanel insights={message.response.insights} />}

            {/* SQL */}
            {message.response.generated_sql && <SqlViewer sql={message.response.generated_sql} />}
          </>
        )}

        <p className="text-2xs pl-1" style={{ color: "var(--text-muted)" }}>
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
