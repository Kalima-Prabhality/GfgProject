"use client";
import { useState, createContext, useContext, useCallback } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface Toast { id: string; message: string; type: "success" | "error" | "info"; }
const ToastContext = createContext<{ toast: (msg: string, type?: Toast["type"]) => void }>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
const styles = {
  success: { bg: "var(--emerald-dim)", border: "rgba(16,185,129,0.2)", color: "var(--emerald)" },
  error:   { bg: "var(--red-dim)",     border: "rgba(239,68,68,0.2)",  color: "var(--red)" },
  info:    { bg: "var(--brand-dim)",   border: "var(--brand-border)",  color: "var(--brand)" },
};

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => {
          const Icon = icons[t.type];
          const s = styles[t.type];
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm pointer-events-auto fade-up"
              style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", minWidth: 280 }}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
