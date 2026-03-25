"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  ShieldCheck,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Shield,
  Zap,
  Globe,
  Users,
  BarChart3,
  CalendarDays,
  Building2,
} from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");

      setAdminExists((count ?? 0) > 0);
      setChecking(false);
    }
    checkAdmin();
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: "admin" },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    setTimeout(() => router.push("/login"), 2000);
  }

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      desc: "Complete employee profiles, departments & org structure",
    },
    {
      icon: CalendarDays,
      title: "Attendance Tracking",
      desc: "Real-time clock in/out with GPS & biometric support",
    },
    {
      icon: BarChart3,
      title: "Leave Management",
      desc: "Automated leave policies, approvals & balance tracking",
    },
    {
      icon: Building2,
      title: "Multi-Department",
      desc: "Organize teams with custom roles & permissions",
    },
  ];

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-medium">
          Checking setup status...
        </div>
      </div>
    );
  }

  // ── Admin exists → Registration Closed ──
  if (adminExists) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-indigo-500 rounded-xl p-2.5 shadow-lg shadow-indigo-500/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-white">
              HRMS.pro
            </span>
          </div>

          {/* Card */}
          <div className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mb-2">
                Registration Closed
              </h2>
              <p className="text-white/60 text-sm">
                This system has already been set up by an administrator.
              </p>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-5 mb-6">
              <p className="font-bold text-white text-sm mb-3">
                How to get access:
              </p>
              <ul className="space-y-2.5">
                {[
                  "Ask your administrator to add you from the admin panel",
                  "You'll receive an email invitation with a setup link",
                  "Click the link to set your password and activate",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-white/60"
                  >
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            <Link href="/login" className="block">
              <Button className="w-full h-12 rounded-xl text-base font-bold bg-indigo-500 hover:bg-indigo-600 transition-all hover:-translate-y-0.5 active:scale-[0.98] gap-2">
                Go to Login
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-[11px] text-white/25 font-medium">
            © 2026 HRMS.pro — Built for modern enterprises
          </p>
        </div>
      </div>
    );
  }

  // ── First-time Admin Setup ──
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
              First-time setup
            </span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-10 py-6">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Info */}
            <div className="order-2 lg:order-1">
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
                Set up your{" "}
                <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text text-transparent">
                  HRMS platform
                </span>
              </h1>
              <p className="text-white/50 text-base lg:text-lg leading-relaxed mb-8 max-w-md">
                Create your admin account to start managing your organization.
                Everything you need to run HR operations in one place.
              </p>

              {/* Features grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <div
                    key={i}
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
                    Create Admin Account
                  </h2>
                  <p className="text-white/50 text-sm">
                    This will be the primary admin for your organization
                  </p>
                </div>

                {error && (
                  <div className="text-sm font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center mb-5">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-center mb-5">
                    Admin account created! Check your email to confirm, then log
                    in.
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-[11px] font-bold uppercase tracking-wider text-white/40"
                    >
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="h-11 pl-10 rounded-xl bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/25 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 font-medium transition-all"
                      />
                    </div>
                  </div>

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
                        placeholder="admin@company.com"
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
                        placeholder="Min. 6 characters"
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

                  {/* Admin info */}
                  <div className="bg-indigo-500/10 border border-indigo-500/15 rounded-xl p-3.5 flex gap-3">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-white/50 leading-relaxed">
                      This account will have{" "}
                      <strong className="text-white/80">
                        full admin access
                      </strong>{" "}
                      to manage employees, attendance, leaves, and system
                      settings.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || success}
                    className="w-full h-11 rounded-xl text-sm font-bold bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 gap-2"
                  >
                    {loading ? (
                      "Creating Account..."
                    ) : (
                      <>
                        Create Admin Account
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-sm text-white/40">
                    Already set up?{" "}
                    <Link
                      href="/login"
                      className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                    >
                      Sign in
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
