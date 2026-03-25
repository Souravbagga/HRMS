"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, ArrowRight,
  Users, Clock, CalendarCheck, BarChart3, Shield, Zap, Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const strength = password.length === 0 ? null
    : password.length < 6 ? "weak"
    : password.length < 10 ? "fair"
    : "strong";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);

    setTimeout(() => {
      router.push("/employee-dashboard");
      router.refresh();
    }, 1500);
  }

  const features = [
    {
      icon: Clock,
      title: "Clock In & Out",
      desc: "Track your daily attendance with one-click check in/out",
    },
    {
      icon: CalendarCheck,
      title: "Apply for Leave",
      desc: "Submit leave requests and track approval status",
    },
    {
      icon: BarChart3,
      title: "View Your Records",
      desc: "Access your attendance history and leave balance anytime",
    },
    {
      icon: Users,
      title: "Team Directory",
      desc: "Connect with your colleagues across departments",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] bg-indigo-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 lg:px-10 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 rounded-xl p-2 shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-black tracking-tight text-white">
              HRMS.pro
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-sm rounded-full px-3.5 py-1.5 border border-white/[0.08]">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
              Account Setup
            </span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-6">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Info */}
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                  your workspace
                </span>
              </h1>
              <p className="text-white/50 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
                You&apos;ve been invited to join your team on HRMS.pro. Set up your
                password to access your employee dashboard.
              </p>

              {/* Features grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f) => (
                  <div
                    key={f.title}
                    className="group flex items-start gap-3 bg-white/[0.04] hover:bg-white/[0.07] backdrop-blur-sm border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-3.5 transition-all duration-200"
                  >
                    <div className="bg-indigo-500/15 rounded-lg p-2 shrink-0 group-hover:bg-indigo-500/25 transition-colors">
                      <f.icon className="w-4 h-4 text-indigo-300" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm leading-tight">
                        {f.title}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5 leading-snug">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/[0.06]">
                {[
                  { step: "1", label: "Set password", active: !done },
                  { step: "2", label: "Access dashboard", active: done },
                  { step: "3", label: "Start working", active: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      s.active ? "bg-indigo-500 text-white" : "bg-white/[0.06] text-white/30"
                    }`}>
                      {s.step}
                    </div>
                    <span className={`text-sm font-medium ${s.active ? "text-white" : "text-white/30"}`}>
                      {s.label}
                    </span>
                    {i < 2 && <div className="w-8 h-px bg-white/[0.08]" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form Card */}
            <div className="order-1 lg:order-2">
              <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20 max-w-md mx-auto lg:mx-0 lg:ml-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-black tracking-tight text-white mb-1">
                    Create Your Password
                  </h2>
                  <p className="text-white/50 text-sm">
                    Set a strong password to activate your account
                  </p>
                </div>

                {error && (
                  <div className="text-sm font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center mb-5">
                    {error}
                  </div>
                )}

                {done && (
                  <div className="flex items-center gap-3 text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-5">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    Password set! Taking you to your dashboard...
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="password"
                      className="text-[11px] font-bold uppercase tracking-wider text-white/40"
                    >
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={done}
                        className="h-11 pl-10 pr-10 rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password strength indicator */}
                    {strength && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {["weak", "fair", "strong"].map((level, i) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              strength === "weak" && i === 0 ? "bg-rose-500"
                              : strength === "fair" && i <= 1 ? "bg-amber-500"
                              : strength === "strong" ? "bg-emerald-500"
                              : "bg-white/[0.08]"
                            }`}
                          />
                        ))}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${
                          strength === "weak" ? "text-rose-400"
                          : strength === "fair" ? "text-amber-400"
                          : "text-emerald-400"
                        }`}>
                          {strength}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="confirm"
                      className="text-[11px] font-bold uppercase tracking-wider text-white/40"
                    >
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input
                        id="confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                        disabled={done}
                        className="h-11 pl-10 rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 font-medium transition-all"
                      />
                    </div>
                    {confirm && password !== confirm && (
                      <p className="text-xs font-semibold text-rose-400 ml-1">Passwords don&apos;t match</p>
                    )}
                    {confirm && password === confirm && confirm.length > 0 && (
                      <p className="text-xs font-semibold text-emerald-400 ml-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Passwords match
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || done}
                    className="w-full h-11 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 gap-2"
                  >
                    {loading ? (
                      "Setting password..."
                    ) : done ? (
                      "Done! Redirecting..."
                    ) : (
                      <>
                        Activate My Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Security note */}
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    Your password is encrypted and stored securely
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 lg:px-10 py-4 flex items-center justify-between">
          <p className="text-[11px] text-white/20 font-medium">
            © 2026 HRMS.pro — Built for modern enterprises
          </p>
          <div className="flex items-center gap-1">
            {[Shield, Zap, Globe].map((Icon, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-md bg-white/[0.04] flex items-center justify-center"
              >
                <Icon className="w-3 h-3 text-white/20" />
              </div>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
