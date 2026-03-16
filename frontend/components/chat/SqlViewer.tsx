"use client";
import { useState } from "react";
import { Copy, Check, Code2, ChevronDown, ChevronUp } from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";

export default function SqlViewer({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(sql);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-2.5 transition-colors"
        style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5" style={{ color: "var(--brand)" }} />
          <span className="font-medium">Generated SQL</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs px-2 py-0.5 rounded-full" style={{ background: "var(--brand-dim)", color: "var(--brand)", border: "1px solid var(--brand-border)" }}>READ ONLY</span>
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>
      {open && (
        <div className="relative fade-in">
          <SyntaxHighlighter language="sql" style={githubGist}
            customStyle={{ margin: 0, background: "var(--bg-card)", fontSize: "0.8rem", padding: "16px", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.7 }}>
            {sql}
          </SyntaxHighlighter>
          <button onClick={copy} className="absolute top-3 right-3 p-1.5 rounded-lg transition-all"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            {copied ? <Check className="w-3.5 h-3.5" style={{ color: "var(--emerald)" }} /> : <Copy className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
          </button>
        </div>
      )}
    </div>
  );
}
