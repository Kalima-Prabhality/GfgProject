"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { authApi } from "@/lib/api";
import { saveAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await authApi.login(email, password);
      saveAuth(res.data.access_token, res.data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Invalid email or password.");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg-base)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, white 0%, transparent 50%), radial-gradient(circle at 70% 70%, white 0%, transparent 50%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl text-white">Nykaa BI</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="font-display text-4xl text-white leading-tight">Ask questions,<br />get answers.</h1>
          <p className="text-white/70 text-lg leading-relaxed">Your marketing data speaks. We help you listen through AI-powered conversations.</p>
          <div className="flex gap-3 flex-wrap">
            {["AI Insights", "6+ Chart Types", "CSV Upload", "PDF Reports"].map(t => (
              <span key={t} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>{t}</span>
            ))}
          </div>
        </div>
        <p className="relative text-white/40 text-sm">Powered by Google Gemini 1.5 Flash</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--brand), var(--accent))" }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">Nykaa BI</span>
          </div>

          <h2 className="font-display mb-2" style={{ color: "var(--text-primary)" }}>Welcome back</h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Sign in to your analytics dashboard</p>

          <div className="card-pro">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-xl text-sm" style={{ background: "var(--red-dim)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--red)" }}>{error}</div>
              )}
              <div>
                <label>Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                    className="input-pro pl-10" />
                </div>
              </div>
              <div>
                <label>Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Enter password"
                    className="input-pro pl-10 pr-10" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full btn-lg justify-center">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            <div className="divider-label mt-5"><span>or</span></div>
            <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
              No account?{" "}
              <Link href="/auth/register" className="font-semibold" style={{ color: "var(--brand)" }}>Create one free</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
