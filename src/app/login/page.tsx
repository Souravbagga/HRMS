"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Users,
  Clock,
  CalendarCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Globe,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "invite_expired") {
      setError(
        "Your invite link has expired. Please ask your admin to resend the invitation."
      );
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Login failed.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    router.push(
      profile?.role === "admin" ? "/dashboard" : "/employee-dashboard"
    );
    router.refresh();
  }

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      desc: "Manage your entire workforce from one central place",
    },
    {
      icon: Clock,
      title: "Attendance Tracking",
      desc: "Real-time clock in/out with automatic hour calculations",
    },
    {
      icon: CalendarCheck,
      title: "Leave Management",
      desc: "Apply, approve, and track leaves effortlessly",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      desc: "Data-driven insights for better workforce decisions",
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
          <Link
            href="/register"
            className="text-sm font-semibold text-white/50 hover:text-white transition-colors"
          >
            Create account
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-6">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Info */}
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
                Streamline your{" "}
                <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                  workforce management
                </span>
              </h1>
              <p className="text-white/50 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
                Everything you need to manage employees, track attendance, and
                handle leaves — all in one powerful platform.
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

              {/* Stats */}
              <div className="flex items-center gap-6 mt-8 pt-6 border-t border-white/[0.06]">
                {[
                  { value: "10K+", label: "Active Users" },
                  { value: "99.9%", label: "Uptime" },
                  { value: "500+", label: "Companies" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-6">
                    <div>
                      <p className="text-xl font-black text-white">
                        {stat.value}
                      </p>
                      <p className="text-white/30 text-[11px] font-medium">
                        {stat.label}
                      </p>
                    </div>
                    {i < 2 && <div className="w-px h-8 bg-white/[0.06]" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Form Card */}
            <div className="order-1 lg:order-2">
              <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20 max-w-md mx-auto lg:mx-0 lg:ml-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-black tracking-tight text-white mb-1">
                    Welcome back
                  </h2>
                  <p className="text-white/50 text-sm">
                    Sign in to your account to continue
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="text-sm font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center mb-5">
                    {error}
                  </div>
                )}

                {/* Login form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-[11px] font-bold uppercase tracking-wider text-white/40"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-11 pl-10 rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 font-medium transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="password"
                      className="text-[11px] font-bold uppercase tracking-wider text-white/40"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-11 pl-10 pr-10 rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 font-medium transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 gap-2"
                  >
                    {loading ? (
                      "Signing in..."
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Trusted indicator */}
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    Secured with enterprise-grade encryption
                  </span>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-white/40">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/register"
                      className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                    >
                      Get started
                    </Link>
                  </p>
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
