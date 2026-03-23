"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";

type Step = "idle" | "saving" | "inviting" | "done" | "error";

export default function NewEmployeePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState("");
  const [inviteWarning, setInviteWarning] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    designation: "",
    joiningDate: "",
    status: "Active" as "Active" | "Inactive" | "On Leave",
  });

  function set(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: String(value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviteWarning("");
    setStep("saving");

    const name = `${form.firstName} ${form.lastName}`.trim();

    // Step 1 — Create employee record in DB
    const supabase = createClient();
    const { error: insertError } = await supabase.from("employees").insert({
      name,
      email: form.email,
      department: form.department || null,
      designation: form.designation || null,
      joining_date: form.joiningDate || null,
      status: form.status,
    });

    if (insertError) {
      setError(insertError.message);
      setStep("error");
      return;
    }

    // Step 2 — Send invite email via server-side API
    setStep("inviting");

    const res = await fetch("/api/employees/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, name }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Employee record was created but invite failed (e.g. already has account)
      setInviteWarning(
        data.error === "User already registered"
          ? "Employee already has an account — no invite sent."
          : `Employee saved but invite failed: ${data.error}`
      );
    }

    setStep("done");
    setTimeout(() => router.push("/employees"), 3000);
  }

  const isLoading = step === "saving" || step === "inviting";
  const isDone = step === "done";

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/employees" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Employee</h1>
          <p className="text-muted-foreground">
            Create a new employee profile and send them an invite to log in.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Details</CardTitle>
          <CardDescription>
            An invitation email will be sent to the employee once saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error */}
            {step === "error" && (
              <div className="text-sm font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Invite warning (record saved but invite had an issue) */}
            {inviteWarning && isDone && (
              <div className="text-sm font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                {inviteWarning}
              </div>
            )}

            {/* Full success */}
            {isDone && !inviteWarning && (
              <div className="flex items-center gap-3 text-sm font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <p>Employee added successfully!</p>
                  <p className="font-normal text-emerald-600/80 text-xs mt-0.5">
                    An invitation email has been sent to <strong>{form.email}</strong>. They can click the link to set their password and log in.
                  </p>
                </div>
              </div>
            )}

            {/* In-progress status */}
            {isLoading && (
              <div className="flex items-center gap-3 text-sm font-semibold text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                {step === "saving" ? "Saving employee record..." : "Sending invitation email..."}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  required
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  disabled={isLoading || isDone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  required
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  disabled={isLoading || isDone}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email address
                <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                  Invite will be sent here
                </span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={isLoading || isDone}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select
                  onValueChange={(v) => v && set("department", v)}
                  disabled={isLoading || isDone}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  placeholder="e.g. Senior Developer"
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                  disabled={isLoading || isDone}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input
                  id="joiningDate"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => set("joiningDate", e.target.value)}
                  disabled={isLoading || isDone}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue="Active"
                  onValueChange={(v) => v && set("status", v)}
                  disabled={isLoading || isDone}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Info box */}
            <div className="bg-muted/50 border border-border/40 rounded-xl p-4 flex gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                The employee will receive an email invitation to set up their password and access the HRMS employee portal. Their account will be linked to this record automatically.
              </p>
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <Link href="/employees" className={buttonVariants({ variant: "outline" })}>
                Cancel
              </Link>
              <Button
                type="submit"
                disabled={isLoading || isDone}
                className="bg-indigo-500 hover:bg-indigo-600 gap-2"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : (
                  <><Mail className="w-4 h-4" /> Save & Send Invite</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
