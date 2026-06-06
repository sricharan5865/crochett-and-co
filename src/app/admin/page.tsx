"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { Eye, EyeOff, Sparkles } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isLoggedIn } = useAdminStore();

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Check status on mount in case they are already authenticated via cookie
    fetch("/api/auth/status").then((res) => {
      if (res.ok) {
        useAdminStore.setState({ isLoggedIn: true });
        router.replace("/admin/dashboard");
      }
    });
  }, [router]);

  useEffect(() => {
    if (isLoggedIn) router.replace("/admin/dashboard");
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 500));

    try {
      const res = await fetch("/api/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      // Wait, is the API URL "/api/auth/login" or "/api/api/auth/login"?
      // It is "/api/auth/login". Let's correct it below.
    } catch (err) {}
  };

  const handleRealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise((r) => setTimeout(r, 500));

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        useAdminStore.setState({ isLoggedIn: true });
        router.replace("/admin/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Incorrect password. Please try again.");
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPassword("");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#0D0D12]">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-rose-500/15 blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "64px 64px" }} />

      <div className={`relative z-10 w-full max-w-[420px] mx-4 ${shake ? "animate-[shake_0.5s_ease]" : ""}`}>
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Crochett <span className="text-violet-400">&</span> Co</h1>
          <p className="text-sm text-white/40 mt-1 tracking-wide uppercase">Admin Console</p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}>
          
          {/* Top accent line */}
          <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.8), rgba(219,39,119,0.8), transparent)" }} />

          <div className="p-8">
            <h2 className="text-lg font-semibold text-white mb-1">Sign in to Admin</h2>
            <p className="text-sm text-white/40 mb-7">Enter your admin password to continue</p>

            <form onSubmit={handleRealSubmit} className="space-y-4">
              {/* Password field */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Password</label>
                <div className="relative group">
                  <input
                    id="admin-password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoFocus
                    className="w-full rounded-xl px-4 py-3.5 pr-12 text-white text-sm outline-none transition-all duration-200"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(124,58,237,0.6)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-rose-300"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="admin-login-btn"
                type="submit"
                disabled={loading || !password}
                className="w-full relative overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: "linear-gradient(135deg, #7c3aed, #db2777)", boxShadow: "0 4px 24px rgba(124,58,237,0.3)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying…
                  </span>
                ) : (
                  "Access Admin Console"
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-white/20">
                Default: <code className="text-white/35 font-mono">admin123</code>
              </p>
              <a href="/" className="text-xs text-white/25 hover:text-white/50 transition-colors">← Back to store</a>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-6px); }
          30%, 60%, 90% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
