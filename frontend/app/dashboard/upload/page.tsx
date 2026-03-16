"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Upload, FileText, Trash2, CheckCircle2, AlertCircle,
  Loader2, Database, RefreshCw, HardDrive, FolderOpen,
} from "lucide-react";
import { api } from "@/lib/api";

interface CSVFile {
  name: string;
  original_name?: string;
  rows: number;
  columns: string[];
  size_bytes?: number;
  uploaded_at: string;
}

export default function UploadPage() {
  const [files, setFiles]         = useState<CSVFile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [dragOver, setDragOver]   = useState(false);
  const [msg, setMsg]             = useState<{ type: "success"|"error"; text: string }|null>(null);

  const loadFiles = useCallback(() => {
    setLoading(true);
    api.get("/api/upload/list")
      .then(r => setFiles(r.data?.files || []))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  async function doUpload(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMsg({ type: "error", text: "Only .csv files are supported." });
      return;
    }
    if (file.size > 1024 * 1024 * 1024) {
      setMsg({ type: "error", text: "File exceeds 1 GB limit." });
      return;
    }

    setUploading(true);
    setProgress(0);
    setMsg(null);

    // Fake progress ticker
    const ticker = setInterval(() => {
      setProgress(p => (p < 80 ? p + Math.random() * 6 : p));
    }, 400);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/upload/csv", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0,
      });
      clearInterval(ticker);
      setProgress(100);
      const d = res.data;
      setMsg({ type: "success", text: `"${file.name}" uploaded — ${d.rows.toLocaleString()} rows · ${d.size_mb} MB` });
      loadFiles();
    } catch (err: unknown) {
      clearInterval(ticker);
      const e = err as { response?: { data?: { detail?: string } } };
      setMsg({ type: "error", text: e.response?.data?.detail || "Upload failed. Check the file and try again." });
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }

  async function deleteFile(name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await api.delete(`/api/upload/csv/${name}`);
      setFiles(p => p.filter(f => f.name !== name));
      setMsg({ type: "success", text: `"${name}" deleted.` });
    } catch {
      setMsg({ type: "error", text: "Delete failed." });
    }
  }

  function fmtSize(b?: number) {
    if (!b) return "";
    if (b > 1e9) return `${(b/1e9).toFixed(2)} GB`;
    if (b > 1e6) return `${(b/1e6).toFixed(1)} MB`;
    return `${(b/1024).toFixed(0)} KB`;
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: "var(--bg-base)" }}>

      {/* ── Header ─────────────────────────────────── */}
      <div className="h-16 flex items-center justify-between px-6 flex-shrink-0 glass"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--emerald), var(--cyan))" }}>
            <HardDrive className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Manrope, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Datasets
            </h1>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Upload CSV files up to 1 GB</p>
          </div>
        </div>
        <button onClick={loadFiles} className="btn-ghost btn-sm" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* ── Default dataset ─────────────────────── */}
          <div className="card-pro flex items-start gap-4" style={{ borderLeft: "4px solid var(--brand)" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--brand-dim)", border: "1px solid var(--brand-border)" }}>
              <Database className="w-6 h-6" style={{ color: "var(--brand)" }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h4 style={{ fontFamily: "Manrope, sans-serif", color: "var(--text-primary)", fontWeight: 700 }}>
                  Nykaa Digital Marketing Dataset
                </h4>
                <span className="badge badge-brand">DEFAULT</span>
                <span className="badge badge-emerald badge-live">Active</span>
              </div>
              <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                55,000+ campaign records with 16 columns — ROI, revenue, channels, audiences and more.
                Always available in the AI Chat tab.
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: "var(--emerald)" }} />
          </div>

          {/* ── Upload zone ─────────────────────────── */}
          <div>
            <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>
              Upload Your Own CSV
            </h3>

            <label
              className="upload-zone block"
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) doUpload(f); }}
              style={{
                borderColor: dragOver ? "var(--brand)" : undefined,
                background:  dragOver ? "var(--brand-dim)" : undefined,
                cursor: uploading ? "not-allowed" : "pointer",
              }}>
              <input type="file" accept=".csv" className="hidden" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = ""; }} />

              {uploading ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <Loader2 className="w-12 h-12 animate-spin" style={{ color: "var(--brand)" }} />
                  <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>Uploading...</p>
                  <div className="w-64 rounded-full overflow-hidden" style={{ height: 8, background: "var(--bg-elevated)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--brand), var(--accent))" }} />
                  </div>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{Math.round(progress)}% — Please wait for large files...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: "var(--brand-dim)", border: "2px dashed var(--brand-border)" }}>
                    <FolderOpen className="w-8 h-8" style={{ color: "var(--brand)" }} />
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: "1.0625rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                      Drop CSV file here or click to browse
                    </p>
                    <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)" }}>
                      Supports <strong style={{ color: "var(--brand)" }}>any CSV file up to 1 GB</strong>. First row must be column headers.
                    </p>
                  </div>
                  <span className="btn-primary btn-sm">
                    <Upload className="w-4 h-4" /> Choose File
                  </span>
                </div>
              )}
            </label>

            {/* Status message */}
            {msg && (
              <div className="mt-3 flex items-center gap-3 px-4 py-3 rounded-xl fade-in"
                style={{
                  background:  msg.type === "success" ? "var(--emerald-dim)" : "var(--red-dim)",
                  border:      `1.5px solid ${msg.type === "success" ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.25)"}`,
                  color:       msg.type === "success" ? "var(--emerald)" : "var(--red)",
                  fontSize:    "0.9375rem",
                }}>
                {msg.type === "success"
                  ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  : <AlertCircle  className="w-5 h-5 flex-shrink-0" />}
                <span>{msg.text}</span>
              </div>
            )}
          </div>

          {/* ── Uploaded files ───────────────────────── */}
          <div>
            <h3 style={{ fontFamily: "Manrope, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.875rem" }}>
              Uploaded Files
              {files.length > 0 && (
                <span style={{ fontSize: "0.9375rem", fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>
                  ({files.length} file{files.length !== 1 ? "s" : ""})
                </span>
              )}
            </h3>

            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="shimmer-skeleton" style={{ height: 72 }} />)}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12 rounded-2xl"
                style={{ border: "2px dashed var(--border-default)", background: "var(--bg-input)" }}>
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "var(--text-muted)" }} />
                <p style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: 500 }}>No uploaded files yet</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-disabled)", marginTop: 4 }}>
                  Upload a CSV above to analyze it with AI
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map(f => (
                  <div key={f.name} className="card-pro group flex items-center gap-4"
                    style={{ padding: "14px 20px" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "var(--emerald-dim)", border: "1px solid rgba(5,150,105,0.2)" }}>
                      <FileText className="w-5 h-5" style={{ color: "var(--emerald)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }} className="truncate">
                        {f.original_name || f.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                          {f.rows.toLocaleString()} rows
                        </span>
                        <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                          {f.columns.length} columns
                        </span>
                        {f.size_bytes && (
                          <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                            {fmtSize(f.size_bytes)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="badge badge-emerald">Ready</span>
                    <button onClick={() => deleteFile(f.name)}
                      className="p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: "var(--red)" }} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Tips ─────────────────────────────────── */}
          <div className="card-pro" style={{ background: "var(--brand-dim)", border: "1.5px solid var(--brand-border)" }}>
            <h4 style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700, color: "var(--brand)", marginBottom: "0.75rem" }}>
              Tips for best AI results
            </h4>
            <ul className="space-y-2">
              {[
                "First row must be column headers (e.g. revenue, date, campaign_type)",
                "Use descriptive column names without special characters",
                "Numeric columns should contain only numbers — no currency symbols",
                "Dates work best in YYYY-MM-DD format",
                "After uploading, select your file from the Dataset Picker in the Chat tab",
                "Large files may take a moment — do not close the tab during upload",
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-3" style={{ fontSize: "0.9375rem", color: "var(--text-secondary)" }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "var(--brand)", color: "white", fontSize: "0.65rem", fontWeight: 700, minWidth: 20 }}>
                    {i+1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}