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

const LIGHT_COLORS = ["#4F46E5","#7C3AED","#06B6D4","#10B981","#F59E0B","#EC4899","#EF4444","#8B5CF6"];
const LIGHT_COLORS_A = ["rgba(79,70,229,0.7)","rgba(124,58,237,0.7)","rgba(6,182,212,0.7)","rgba(16,185,129,0.7)","rgba(245,158,11,0.7)","rgba(236,72,153,0.7)","rgba(239,68,68,0.7)","rgba(139,92,246,0.7)"];

export default function ChartRenderer({ chartType, chartData, tableData, historyId, title }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [showTable, setShowTable] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const textColor  = "rgba(61,59,82,0.9)";
  const gridColor  = "rgba(99,102,241,0.08)";
  const tooltipBg  = "rgba(255,255,255,0.98)";
  const tooltipBdr = "rgba(99,102,241,0.25)";

  const sharedPlugins = {
    legend: { labels: { color: textColor, font: { size: 12, family: "'Satoshi', sans-serif" }, padding: 20, boxWidth: 12 } },
    tooltip: {
      backgroundColor: tooltipBg, borderColor: tooltipBdr, borderWidth: 1,
      titleColor: "#0F0E1A", bodyColor: "rgba(61,59,82,0.9)",
      padding: 12, cornerRadius: 10, titleFont: { family: "'Clash Display', sans-serif", weight: 600 as const },
    },
  };

  const sharedScales = {
    x: { ticks: { color: textColor, font: { size: 11 }, maxRotation: 35 }, grid: { color: gridColor }, border: { color: "rgba(99,102,241,0.12)" } },
    y: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor }, border: { color: "rgba(99,102,241,0.12)" } },
  };

  const barOpts: ChartOptions<"bar"> = {
    responsive: true, maintainAspectRatio: false, animation: { duration: 600 },
    plugins: { ...sharedPlugins, title: title ? { display: true, text: title, color: "#0F0E1A", font: { family: "'Clash Display', sans-serif", size: 14, weight: 600 as const } } : undefined },
    scales: sharedScales,
  };
  const lineOpts: ChartOptions<"line"> = { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, plugins: sharedPlugins, scales: sharedScales };
  const pieOpts:  ChartOptions<"pie">  = { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, plugins: sharedPlugins };
  const donutOpts:ChartOptions<"doughnut"> = { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, plugins: { ...sharedPlugins, legend: { ...sharedPlugins.legend, position: "right" as const } }, cutout: "62%" };
  const radarOpts:ChartOptions<"radar"> = { responsive: true, maintainAspectRatio: false, plugins: sharedPlugins, scales: { r: { ticks: { color: textColor, font: { size: 10 }, backdropColor: "transparent" }, grid: { color: gridColor }, angleLines: { color: gridColor }, pointLabels: { color: textColor, font: { size: 11 } } } } };

  async function downloadPng() {
    const { default: h2c } = await import("html2canvas");
    if (!chartRef.current) return;
    setDownloading("png");
    const canvas = await h2c(chartRef.current, { backgroundColor: "#ffffff" });
    const a = document.createElement("a"); a.download = `chart-${Date.now()}.png`; a.href = canvas.toDataURL(); a.click();
    setDownloading(null);
  }

  async function handleExport(type: "csv" | "pdf") {
    if (!historyId) return;
    setDownloading(type);
    try { await exportDownload(type, historyId); } catch { alert(`Export failed`); }
    setDownloading(null);
  }

  const injectColors = (data: AppChartData | null): AppChartData | null => {
    if (!data) return null;
    return {
      ...data,
      datasets: data.datasets.map((ds, i) => ({
        ...ds,
        borderWidth: 2,
        backgroundColor: chartType === "pie" || chartType === "doughnut"
          ? LIGHT_COLORS_A.slice(0, data.labels.length)
          : LIGHT_COLORS_A[i % LIGHT_COLORS_A.length],
        borderColor: chartType === "pie" || chartType === "doughnut"
          ? LIGHT_COLORS.slice(0, data.labels.length)
          : LIGHT_COLORS[i % LIGHT_COLORS.length],
        borderRadius: chartType === "bar" ? 6 : undefined,
        pointRadius: chartType === "line" || chartType === "area" ? 4 : undefined,
        pointBackgroundColor: LIGHT_COLORS[i % LIGHT_COLORS.length],
        fill: chartType === "area",
        tension: (chartType === "line" || chartType === "area") ? 0.4 : undefined,
      })),
    };
  };

  const coloredData = injectColors(chartData);
  const H = 300;

  const renderChart = () => {
    if (!coloredData || !coloredData.labels?.length) return null;
    const bd = coloredData as unknown as ChartJSData<"bar">;
    const ld = coloredData as unknown as ChartJSData<"line">;
    const pd = coloredData as unknown as ChartJSData<"pie">;
    const dd = coloredData as unknown as ChartJSData<"doughnut">;
    const rd = coloredData as unknown as ChartJSData<"radar">;

    switch (chartType) {
      case "line":  case "area":   return <div style={{ height: H }}><Line     data={ld} options={lineOpts}  /></div>;
      case "pie":                  return <div style={{ height: H }}><Pie      data={pd} options={pieOpts}   /></div>;
      case "doughnut":             return <div style={{ height: H }}><Doughnut data={dd} options={donutOpts} /></div>;
      case "radar":                return <div style={{ height: H }}><Radar    data={rd} options={radarOpts} /></div>;
      default:                     return <div style={{ height: H }}><Bar      data={bd} options={barOpts}   /></div>;
    }
  };

  const renderTable = () => {
    const rows = tableData || [];
    if (!rows.length) return null;
    const cols = Object.keys(rows[0]);
    return (
      <div className="overflow-auto rounded-xl mt-3" style={{ maxHeight: 280, border: "1px solid var(--border-subtle)" }}>
        <table className="table-pro">
          <thead><tr>{cols.map(c => <th key={c}>{c.replace(/_/g, " ")}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {cols.map(c => (
                  <td key={c}>{typeof row[c] === "number" ? (row[c] as number).toLocaleString("en-IN") : String(row[c] ?? "")}</td>
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
      <div className="flex flex-col items-center justify-center h-32 gap-2" style={{ color: "var(--text-muted)" }}>
        <BarChart2 className="w-8 h-8 opacity-25" /><p className="text-sm">No data to display</p>
      </div>
    );
  }

  const btnStyle = { background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", color: "var(--text-muted)", borderRadius: 8, padding: "5px 10px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: 5, cursor: "pointer", transition: "all 0.15s ease" };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          {hasChart && hasRows && (
            <button style={btnStyle} onClick={() => setShowTable(!showTable)}>
              <Table2 className="w-3 h-3" />{showTable ? "Hide data" : "Show data"}
            </button>
          )}
        </div>
        <div className="flex gap-1.5">
          {hasChart && (
            <button style={btnStyle} onClick={downloadPng} disabled={!!downloading}>
              <Download className="w-3 h-3" />{downloading === "png" ? "..." : "PNG"}
            </button>
          )}
          {historyId && <>
            <button style={btnStyle} onClick={() => handleExport("csv")} disabled={!!downloading}>
              <Download className="w-3 h-3" />{downloading === "csv" ? "..." : "CSV"}
            </button>
            <button style={btnStyle} onClick={() => handleExport("pdf")} disabled={!!downloading}>
              <Download className="w-3 h-3" />{downloading === "pdf" ? "..." : "PDF"}
            </button>
          </>}
        </div>
      </div>
      {hasChart && <div ref={chartRef} className="p-2">{renderChart()}</div>}
      {(chartType === "table" || showTable) && hasRows && renderTable()}
    </div>
  );
}
