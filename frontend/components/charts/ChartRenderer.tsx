"use client";
import { useRef, useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler,
  type ChartData as ChartJSData, type ChartOptions,
} from "chart.js";
import { Bar, Line, Pie, Doughnut, Radar } from "react-chartjs-2";
import { Download, Table2, BarChart2 } from "lucide-react";
import { exportDownload } from "@/lib/api";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler);

export interface AppChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
    borderRadius?: number;
    pointRadius?: number;
  }[];
}

export interface Props {
  chartType: string;
  chartData: AppChartData | null;
  tableData: Record<string, unknown>[] | null;
  historyId?: number;
  title?: string;
}

// ✅ Nykaa brand colors
const NYKAA_SOLID = [
  "#E8005A","#9D0039","#FF4D8F","#C4004A",
  "#FF79A8","#B8003F","#FF1744","#D81B60",
  "#F50057","#800029","#F06292","#6B0027",
];
const NYKAA_ALPHA = [
  "rgba(232,0,90,0.88)","rgba(157,0,57,0.88)","rgba(255,77,143,0.88)","rgba(196,0,74,0.88)",
  "rgba(255,121,168,0.88)","rgba(184,0,63,0.88)","rgba(255,23,68,0.88)","rgba(216,27,96,0.88)",
  "rgba(245,0,87,0.88)","rgba(128,0,41,0.88)","rgba(240,98,146,0.88)","rgba(107,0,39,0.88)",
];

// ✅ Chart.js does NOT support CSS variables — use explicit colors for both themes
// These work well on both light and dark backgrounds
const AXIS_TEXT    = "#7A3055";   // dark pink — visible on both light and dark
const AXIS_GRID    = "rgba(157,0,57,0.10)";
const AXIS_BORDER  = "rgba(157,0,57,0.15)";
const TOOLTIP_BG   = "rgba(18,0,10,0.95)";
const TOOLTIP_BDR  = "rgba(232,0,90,0.35)";

export default function ChartRenderer({ chartType, chartData, tableData, historyId, title }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showTable,   setShowTable]   = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  async function downloadPng() {
    const { default: h2c } = await import("html2canvas");
    if (!chartRef.current) return;
    setDownloading("png");
    const canvas = await h2c(chartRef.current, { backgroundColor: "#0A0008" });
    const a = document.createElement("a");
    a.download = `chart-${Date.now()}.png`;
    a.href = canvas.toDataURL();
    a.click();
    setDownloading(null);
  }

  async function handleExport(type: "csv" | "pdf") {
    if (!historyId) return;
    setDownloading(type);
    try { await exportDownload(type, historyId); } catch { alert("Export failed"); }
    setDownloading(null);
  }

  const sharedPlugins = {
    legend: {
      labels: {
        color: AXIS_TEXT,
        font: { size: 12, family: "'DM Sans', sans-serif" },
        padding: 20, boxWidth: 12,
        usePointStyle: true, pointStyleWidth: 10,
      },
    },
    tooltip: {
      backgroundColor: TOOLTIP_BG,
      borderColor: TOOLTIP_BDR,
      borderWidth: 1.5,
      titleColor: "#FFF0F5",
      bodyColor: "#FFBDD0",
      padding: 14,
      cornerRadius: 12,
      titleFont: { family: "'Playfair Display', serif", weight: 700 as const, size: 13 },
      bodyFont: { family: "'DM Sans', sans-serif", size: 12 },
    },
  };

  const formatTick = (val: number | string) => {
    const n = Number(val);
    if (n >= 1_000_000_000) return `₹${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000)     return `₹${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString("en-IN");
  };

  const sharedScales = {
    x: {
      ticks: {
        color: AXIS_TEXT,
        font: { size: 11, family: "'DM Sans', sans-serif" },
        maxRotation: 35,
      },
      grid:   { color: AXIS_GRID },
      border: { color: AXIS_BORDER },
    },
    y: {
      beginAtZero: true,
      ticks: {
        color: AXIS_TEXT,
        font: { size: 11, family: "'DM Sans', sans-serif" },
        callback: formatTick,
      },
      grid:   { color: AXIS_GRID },
      border: { color: AXIS_BORDER },
    },
  };

  const barOpts: ChartOptions<"bar"> = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    plugins: {
      ...sharedPlugins,
      title: title ? {
        display: true, text: title,
        color: "#FFF0F5",
        font: { family: "'Playfair Display', serif", size: 14, weight: 700 as const },
        padding: { bottom: 16 },
      } : undefined,
    },
    scales: sharedScales,
  };

  const lineOpts: ChartOptions<"line"> = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 700, easing: "easeOutQuart" },
    plugins: sharedPlugins,
    scales: sharedScales,
  };

  const pieOpts: ChartOptions<"pie"> = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 700 },
    plugins: { ...sharedPlugins, legend: { ...sharedPlugins.legend, position: "right" as const } },
  };

  const donutOpts: ChartOptions<"doughnut"> = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 700 },
    plugins: { ...sharedPlugins, legend: { ...sharedPlugins.legend, position: "right" as const } },
    cutout: "62%",
  };

  const radarOpts: ChartOptions<"radar"> = {
    responsive: true, maintainAspectRatio: false,
    plugins: sharedPlugins,
    scales: {
      r: {
        ticks: { color: AXIS_TEXT, font: { size: 10 }, backdropColor: "transparent" },
        grid:        { color: AXIS_GRID },
        angleLines:  { color: AXIS_GRID },
        pointLabels: { color: AXIS_TEXT, font: { size: 11, family: "'DM Sans', sans-serif" } },
      },
    },
  };

  // ✅ Inject Nykaa colors — each bar gets a different shade
  const injectColors = (data: AppChartData | null): AppChartData | null => {
    if (!data) return null;
    const isMulti = chartType === "pie" || chartType === "doughnut" || chartType === "bar";
    return {
      ...data,
      datasets: data.datasets.map((ds, i) => ({
        ...ds,
        borderWidth: chartType === "bar" ? 0 : 2,
        backgroundColor: isMulti
          ? NYKAA_ALPHA.slice(0, data.labels.length)
          : chartType === "line" || chartType === "area"
          ? "rgba(232,0,90,0.12)"
          : NYKAA_ALPHA[i % NYKAA_ALPHA.length],
        borderColor: isMulti
          ? NYKAA_SOLID.slice(0, data.labels.length)
          : "#E8005A",
        borderRadius:       chartType === "bar" ? 10 : undefined,
        borderSkipped:      false,
        pointRadius:        chartType === "line" || chartType === "area" ? 5 : undefined,
        pointBackgroundColor: "#E8005A",
        pointBorderColor:   "#fff",
        pointBorderWidth:   2,
        pointHoverRadius:   chartType === "line" || chartType === "area" ? 8 : undefined,
        fill:               chartType === "area",
        tension:            chartType === "line" || chartType === "area" ? 0.4 : undefined,
      })),
    };
  };

  const coloredData = injectColors(chartData);
  const H = 320;

  const renderChart = () => {
    if (!coloredData || !coloredData.labels?.length) return null;
    const bd = coloredData as unknown as ChartJSData<"bar">;
    const ld = coloredData as unknown as ChartJSData<"line">;
    const pd = coloredData as unknown as ChartJSData<"pie">;
    const dd = coloredData as unknown as ChartJSData<"doughnut">;
    const rd = coloredData as unknown as ChartJSData<"radar">;

    switch (chartType) {
      case "line": case "area": return <div style={{ height: H }}><Line     data={ld} options={lineOpts}  /></div>;
      case "pie":               return <div style={{ height: H }}><Pie      data={pd} options={pieOpts}   /></div>;
      case "doughnut":          return <div style={{ height: H }}><Doughnut data={dd} options={donutOpts} /></div>;
      case "radar":             return <div style={{ height: H }}><Radar    data={rd} options={radarOpts} /></div>;
      default:                  return <div style={{ height: H }}><Bar      data={bd} options={barOpts}   /></div>;
    }
  };

  const renderTable = () => {
    const rows = tableData || [];
    if (!rows.length) return null;
    const cols = Object.keys(rows[0]);
    return (
      <div style={{ overflowX: "auto", borderRadius: 12, marginTop: 12, border: "1px solid var(--border-subtle)", maxHeight: 280 }}>
        <table className="table-pro">
          <thead>
            <tr>{cols.map(c => <th key={c}>{c.replace(/_/g, " ")}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c}>
                    {typeof row[c] === "number"
                      ? (row[c] as number).toLocaleString("en-IN")
                      : String(row[c] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const hasChart = !!coloredData && chartType !== "table";
  const hasRows  = !!(tableData && tableData.length > 0);

  if (!hasChart && !hasRows) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 120, gap: 8, color: "var(--text-muted)" }}>
        <BarChart2 style={{ width: 32, height: 32, opacity: 0.25 }} />
        <p style={{ fontSize: "0.875rem" }}>No data to display</p>
      </div>
    );
  }

  const btnStyle: React.CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1.5px solid var(--border-subtle)",
    color: "var(--text-muted)",
    borderRadius: 9, padding: "6px 12px",
    fontSize: "0.775rem", fontWeight: 600,
    display: "inline-flex", alignItems: "center", gap: 5,
    cursor: "pointer", transition: "all 0.15s ease",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {hasChart && hasRows && (
            <button style={btnStyle} onClick={() => setShowTable(!showTable)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
              <Table2 style={{ width: 13, height: 13 }} />
              {showTable ? "Hide data" : "Show data"}
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {hasChart && (
            <button style={btnStyle} onClick={downloadPng} disabled={!!downloading}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--brand)"; (e.currentTarget as HTMLElement).style.color = "var(--brand)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
              <Download style={{ width: 13, height: 13 }} />
              {downloading === "png" ? "..." : "PNG"}
            </button>
          )}
          {historyId && (
            <>
              <button style={btnStyle} onClick={() => handleExport("csv")} disabled={!!downloading}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--emerald)"; (e.currentTarget as HTMLElement).style.color = "var(--emerald)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
                <Download style={{ width: 13, height: 13 }} />
                {downloading === "csv" ? "..." : "CSV"}
              </button>
              <button style={btnStyle} onClick={() => handleExport("pdf")} disabled={!!downloading}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border-subtle)"; (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; }}>
                <Download style={{ width: 13, height: 13 }} />
                {downloading === "pdf" ? "..." : "PDF"}
              </button>
            </>
          )}
        </div>
      </div>

      {hasChart && <div ref={chartRef} style={{ padding: "4px 2px" }}>{renderChart()}</div>}
      {(chartType === "table" || showTable) && hasRows && renderTable()}
    </div>
  );
}