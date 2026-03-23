"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ShieldCheck, Mail, Lock } from "lucide-react";
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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError === "invite_expired") {
      setError("Your invite link has expired. Please ask your admin to resend the invitation.");
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

    // Fetch profile to determine redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Login failed."); setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    router.push(profile?.role === "admin" ? "/dashboard" : "/employee-dashboard");
    router.refresh();
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
          <p className="text-muted-foreground text-sm font-medium">The ultimate workforce management system</p>
        </div>

        <Card className="rounded-[2.5rem] border-border/40 shadow-2xl shadow-indigo-500/10 bg-card/80 backdrop-blur-xl p-2 sm:p-4 border-2">
          <CardHeader className="space-y-2 text-center pt-8">
            <CardTitle className="text-2xl font-black tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-muted-foreground font-medium text-sm">
              Securely log in to manage your workspace.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="grid gap-6 pt-4">
              {error && (
                <div className="text-sm font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-center">
                  {error}
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50 font-bold transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 pl-12 rounded-2xl bg-muted/20 border-border/40 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500/50 font-bold transition-all text-xl"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-14 rounded-2xl text-lg font-black shadow-lg shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Continue to Dashboard"}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="flex flex-col gap-4 pb-10 pt-2">
            <p className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-indigo-500 hover:underline">
                Register here
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="mt-8 text-center text-xs text-muted-foreground/60 font-medium">
          © 2026 HRMS.pro — Built for high-performance enterprises.
        </p>
      </div>
    </div>
  );
}
