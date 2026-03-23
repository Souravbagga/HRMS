"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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

    // Redirect to employee dashboard after short delay
    setTimeout(() => {
      router.push("/employee-dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50 dark:opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-indigo-500 rounded-2xl p-3 shadow-xl shadow-indigo-500/20 mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-foreground mb-1">HRMS.pro</h1>
          <p className="text-muted-foreground text-sm font-medium">Welcome! Set up your account password.</p>
        </div>

        <Card className="rounded-[2.5rem] border-border/40 shadow-2xl shadow-indigo-500/10 bg-card/80 backdrop-blur-xl p-2 sm:p-4 border-2">
          <CardHeader className="space-y-2 text-center pt-8">
            <CardTitle className="text-2xl font-black tracking-tight">Create Your Password</CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-sm">
              You&apos;ve been invited to HRMS.pro. Set a strong password to activate your account.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="grid gap-5 pt-4 pb-8">
              {error && (
                <div className="text-sm font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center">
                  {error}
                </div>
              )}

              {done && (
                <div className="flex items-center gap-3 text-sm font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  Password set! Taking you to your dashboard...
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={done}
                    className="h-14 pl-12 pr-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50 font-bold transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength indicator */}
                {strength && (
                  <div className="flex gap-1.5 mt-1">
                    {["weak", "fair", "strong"].map((level, i) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strength === "weak" && i === 0 ? "bg-rose-500"
                          : strength === "fair" && i <= 1 ? "bg-amber-500"
                          : strength === "strong" ? "bg-emerald-500"
                          : "bg-muted"
                        }`}
                      />
                    ))}
                    <span className={`text-[10px] font-black uppercase tracking-widest ml-1 ${
                      strength === "weak" ? "text-rose-500"
                      : strength === "fair" ? "text-amber-500"
                      : "text-emerald-500"
                    }`}>
                      {strength}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="confirm" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    disabled={done}
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50 font-bold transition-all"
                  />
                </div>
                {confirm && password !== confirm && (
                  <p className="text-xs font-semibold text-rose-500 ml-1">Passwords don&apos;t match</p>
                )}
                {confirm && password === confirm && confirm.length > 0 && (
                  <p className="text-xs font-semibold text-emerald-600 ml-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || done}
                className="h-14 rounded-2xl text-lg font-black shadow-lg shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 mt-2"
              >
                {loading ? "Setting password..." : done ? "Done! Redirecting..." : "Activate My Account"}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  );
}
