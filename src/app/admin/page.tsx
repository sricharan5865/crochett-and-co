"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/lib/admin-store";
import { Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

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
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Animated premium floating background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[var(--color-rose-pink)]/10 blur-[130px]" 
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -30, 20, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] rounded-full bg-[var(--color-lavender)]/8 blur-[130px]" 
          animate={{
            x: [0, -50, 30, 0],
            y: [0, 40, -30, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        <div className="absolute top-[35%] left-[30%] w-[350px] h-[350px] rounded-full bg-[var(--color-cream)]/3 blur-[120px]" />
      </div>

      {/* Modern thin line overlay grid */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: "linear-gradient(#F0E4DB 1px, transparent 1px), linear-gradient(90deg, #F0E4DB 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

      <div className="relative z-10 w-full max-w-[420px] mx-4">
        {/* Animated logo header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-tr from-[var(--color-rose-pink)] to-[var(--color-lavender)] shadow-[0_0_30px_rgba(242,138,174,0.3)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-wide">
            Crochett <span className="text-[var(--color-rose-pink)]">&</span> Co
          </h1>
          <p className="text-xs text-foreground/40 mt-1.5 tracking-widest uppercase">Admin Console</p>
        </motion.div>

        {/* Glassmorphic card container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: shake ? [-8, 8, -6, 6, -4, 4, 0] : 0
          }}
          transition={{ 
            scale: { duration: 0.5, ease: "easeOut" },
            opacity: { duration: 0.5, ease: "easeOut" },
            x: { duration: 0.5, ease: "easeInOut" }
          }}
          className="glass relative rounded-2xl overflow-hidden shadow-2xl border border-border"
        >
          {/* Top accent gradient border line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[var(--color-rose-pink)] to-[var(--color-lavender)]" />

          <div className="p-8">
            <h2 className="text-xl font-semibold text-foreground tracking-wide mb-1">Sign In</h2>
            <p className="text-sm text-muted-foreground mb-8">Enter your security credentials to access dashboard</p>

            <form onSubmit={handleRealSubmit} className="space-y-5">
              {/* Password field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block">Password</label>
                <div className="relative group">
                  <input
                    id="admin-password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    autoFocus
                    className="w-full rounded-xl px-4 py-3.5 pr-12 text-foreground text-sm outline-none transition-all duration-200 bg-white border border-border focus:border-[var(--color-rose-pink)] focus:shadow-[0_0_15px_rgba(242,138,174,0.15)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-[var(--color-rose-pink)] transition-colors"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-rose-600 bg-rose-50/80 border border-rose-100"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-rose-pink)] shrink-0 animate-ping" />
                  {error}
                </motion.div>
              )}

              {/* Submit Button */}
              <button
                id="admin-login-btn"
                type="submit"
                disabled={loading || !password}
                className="w-full relative overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:shadow-[0_0_20px_rgba(242,138,174,0.3)] bg-gradient-to-r from-[var(--color-rose-pink)] to-[var(--color-lavender)] hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating…
                  </span>
                ) : (
                  <span className="text-[#1A1218] font-bold">Access Dashboard</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
              <p className="text-xs text-foreground/20">
                Default: <code className="text-foreground/35 font-mono">admin123</code>
              </p>
              <a href="/" className="text-xs text-foreground/60 hover:text-[var(--color-rose-pink)] transition-colors flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to store
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
