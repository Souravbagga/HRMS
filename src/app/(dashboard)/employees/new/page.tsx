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
import { ArrowLeft, Loader2, Mail, CheckCircle2, ShieldCheck, Info, Building2, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { DEFAULT_LEAVE_BALANCES } from "@/types";

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
    role: "employee" as "admin" | "employee",
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
    const { data: newEmp, error: insertError } = await supabase.from("employees").insert({
      name,
      email: form.email,
      department: form.department || null,
      designation: form.designation || null,
      joining_date: form.joiningDate || null,
      status: form.status,
    }).select("id").single();

    if (insertError) {
      setError(insertError.message);
      setStep("error");
      return;
    }

    // Step 1b — Initialize leave balances for the new employee
    if (newEmp) {
      await supabase.from("leave_balances").insert({
        employee_id: newEmp.id,
        ...DEFAULT_LEAVE_BALANCES,
        annual_used: 0,
        sick_used: 0,
        casual_used: 0,
        earned_used: 0,
        maternity_used: 0,
        paternity_used: 0,
      });
    }

    // Step 2 — Send invite email via server-side API
    setStep("inviting");

    const res = await fetch("/api/employees/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, name, role: form.role }),
    });

    const data = await res.json();

    if (!res.ok) {
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
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
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

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form — takes 2/3 */}
        <div className="lg:col-span-2">
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

                {/* Invite warning */}
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

                {/* Role selector */}
                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                    Account Role
                  </Label>
                  <Select
                    defaultValue="employee"
                    onValueChange={(v) => v && set("role", v)}
                    disabled={isLoading || isDone}
                  >
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    {form.role === "admin"
                      ? "This user will have full admin access to manage employees, attendance, and leaves."
                      : "This user will have access to their own dashboard to clock in/out and apply for leaves."}
                  </p>
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

        {/* Sidebar — takes 1/3 */}
        <div className="space-y-4">
          {/* How it works */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                How it works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { step: "1", title: "Fill in details", desc: "Enter the employee's name, email, and role" },
                { step: "2", title: "Save & invite", desc: "Click save to create the record and send an email invite" },
                { step: "3", title: "Employee sets up", desc: "They click the link in their email to set a password" },
                { step: "4", title: "Ready to go", desc: "Employee can now log in and access their dashboard" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-500">{item.step}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                Quick tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                "Use the employee's official company email for invites",
                "Department and designation help organize your team",
                "Admin role gives full system access — assign carefully",
                "Employees can update their own profile after signing in",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Departments overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" />
                Available Departments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {["Engineering", "Design", "Sales", "Marketing", "HR", "Finance", "Operations"].map((dept) => (
                  <span key={dept} className="text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                    {dept}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
