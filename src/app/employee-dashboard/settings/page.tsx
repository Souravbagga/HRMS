"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";

export default function EmployeeSettingsPage() {
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
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", profile.id);

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
    <div className="flex flex-col gap-0 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and security.</p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden divide-y divide-border/40">

        {/* Section: Profile */}
        <div className="p-6 sm:p-8">
          <div>
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Profile</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Your personal information.</p>
          </div>

          <div className="mt-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-foreground shrink-0 border border-border/40">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">{profile?.name ?? "—"}</p>
              <p className="text-sm text-muted-foreground truncate">{profile?.email ?? ""}</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {profile?.role ?? "employee"}
              </span>
              {profile?.department && (
                <span className="text-[11px] text-muted-foreground">{profile.department}</span>
              )}
            </div>
          </div>
        </div>

        {/* Section: Display Name */}
        <form onSubmit={handleUpdateName} className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Display Name</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">This is how your name appears across the system.</p>

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

        {/* Section: Password */}
        <form onSubmit={handleChangePassword} className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Password</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-5">Update your password to keep your account secure.</p>

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
            <Button type="submit" disabled={pwLoading} variant="outline" className="h-10 px-5 font-medium">
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </div>
        </form>

        {/* Section: Account Info */}
        <div className="p-6 sm:p-8 bg-muted/20">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">Account</h2>
          <p className="text-xs text-muted-foreground mb-4">Your account was created on {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}.</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Account active · Employee access</span>
          </div>
        </div>
      </div>
    </div>
  );
}
