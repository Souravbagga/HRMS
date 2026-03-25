"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Lock, User, CheckCircle2, Loader2, Eye, EyeOff, Shield, Mail, Clock, Info } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";

export default function AdminSettingsPage() {
  const profile = useUserStore((s) => s.profile);
  const setProfile = useUserStore((s) => s.setProfile);

  const [name, setName] = useState(profile?.name ?? "");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault();
    setNameError("");
    if (!name.trim()) { setNameError("Name cannot be empty."); return; }
    if (!profile) return;

    setNameLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", profile.id);

    if (error) { setNameError(error.message); setNameLoading(false); return; }
    setProfile({ ...profile, name: name.trim() });
    setNameSuccess(true);
    setNameLoading(false);
    setTimeout(() => setNameSuccess(false), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }

    setPwLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) { setPwError(error.message); setPwLoading(false); return; }
    setPwSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
    setPwLoading(false);
    setTimeout(() => setPwSuccess(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and security.</p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main settings — takes 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-lg font-bold text-indigo-500 shrink-0 border-2 border-indigo-500/20">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-foreground">{profile?.name ?? "—"}</p>
                  <p className="text-sm text-muted-foreground truncate">{profile?.email ?? ""}</p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-3 py-1.5 rounded-full">
                  {profile?.role ?? "admin"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Display Name Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                Display Name
              </CardTitle>
              <p className="text-xs text-muted-foreground">This is how your name appears across the system.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName}>
                {nameError && (
                  <div className="text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-4">{nameError}</div>
                )}
                {nameSuccess && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Updated successfully.
                  </div>
                )}

                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="h-10" />
                  </div>
                  <Button type="submit" disabled={nameLoading} variant="outline" className="h-10 px-5 font-medium shrink-0">
                    {nameLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                Password
              </CardTitle>
              <p className="text-xs text-muted-foreground">Update your password to keep your account secure.</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword}>
                {pwError && (
                  <div className="text-xs font-medium text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2 mb-4">{pwError}</div>
                )}
                {pwSuccess && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 mb-4">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Password changed successfully.
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="h-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Confirm Password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="h-10"
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-rose-500">Passwords don&apos;t match</p>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <Button type="submit" disabled={pwLoading} className="h-10 px-5 font-medium bg-indigo-500 hover:bg-indigo-600">
                    {pwLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider">Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Account created on{" "}
                    <span className="text-foreground font-medium">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Account active · {profile?.role === "admin" ? "Full administrator access" : "Employee access"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — takes 1/3 */}
        <div className="space-y-4">
          {/* Account overview card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-medium text-foreground truncate">{profile?.name ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">{profile?.email ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="text-sm font-medium text-foreground capitalize">{profile?.role ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Member since</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                Security Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                "Use a strong password with at least 8 characters",
                "Mix uppercase, lowercase, numbers, and symbols",
                "Don't reuse passwords across services",
                "Change your password regularly",
                "Never share your login credentials",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
