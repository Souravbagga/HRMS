"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import {
  ArrowLeft, Loader2, CheckCircle2, Save, Mail, User,
  Building2, Briefcase, Calendar, Shield, Info, AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import type { Employee } from "@/types";

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    joiningDate: "",
    status: "Active" as "Active" | "Inactive" | "On Leave",
  });

  const [original, setOriginal] = useState(form);

  useEffect(() => {
    async function fetchEmployee() {
      const supabase = createClient();
      const { data } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (!data) { setNotFound(true); setLoading(false); return; }

      const emp = data as Employee;
      const formData = {
        name: emp.name,
        email: emp.email,
        department: emp.department ?? "",
        designation: emp.designation ?? "",
        joiningDate: emp.joining_date ?? "",
        status: emp.status,
      };
      setForm(formData);
      setOriginal(formData);
      setLoading(false);
    }
    fetchEmployee();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("employees")
      .update({
        name: form.name,
        email: form.email,
        department: form.department || null,
        designation: form.designation || null,
        joining_date: form.joiningDate || null,
        status: form.status,
      })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    setTimeout(() => router.push(`/employees/${id}`), 1500);
  }

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const hasChanges = JSON.stringify(form) !== JSON.stringify(original);
  const initials = form.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-medium">Loading employee...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="font-bold text-lg">Employee not found</p>
        <Link href="/employees" className={buttonVariants({ variant: "outline", className: "rounded-xl" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Employees
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/employees/${id}`}
          className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl border border-border/40 bg-card hover:bg-muted" })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Employee</h1>
          <p className="text-muted-foreground mt-1">
            Update profile details for <span className="font-bold text-foreground">{form.name}</span>.
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
              <CardDescription>Make changes and click save to update the employee record.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="text-sm font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-3 text-sm font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <p>Employee updated successfully!</p>
                      <p className="font-normal text-emerald-600/80 text-xs mt-0.5">Redirecting to profile...</p>
                    </div>
                  </div>
                )}

                {saving && (
                  <div className="flex items-center gap-3 text-sm font-semibold text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    Saving changes...
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    disabled={saving || success}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      disabled={saving || success}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                      Department
                    </Label>
                    <Select
                      value={form.department}
                      onValueChange={(v) => v && set("department", v)}
                      disabled={saving || success}
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
                    <Label htmlFor="designation" className="flex items-center gap-2">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                      Designation
                    </Label>
                    <Input
                      id="designation"
                      placeholder="e.g. Senior Developer"
                      value={form.designation}
                      onChange={(e) => set("designation", e.target.value)}
                      disabled={saving || success}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="joiningDate" className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      Joining Date
                    </Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => set("joiningDate", e.target.value)}
                      disabled={saving || success}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      Status
                    </Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => v && set("status", v)}
                      disabled={saving || success}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                        <SelectItem value="On Leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Changes indicator */}
                {hasChanges && !success && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3">
                    <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-600 font-medium leading-relaxed">
                      You have unsaved changes. Click &quot;Save Changes&quot; to apply them.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-2">
                  <Link href={`/employees/${id}`} className={buttonVariants({ variant: "outline" })}>
                    Cancel
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving || success || !hasChanges}
                    className="bg-indigo-500 hover:bg-indigo-600 gap-2 hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : (
                      <><Save className="w-4 h-4" /> Save Changes</>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — takes 1/3 */}
        <div className="space-y-4">
          {/* Employee preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-500" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                <AvatarFallback className="bg-indigo-500/10 text-indigo-500 font-bold text-lg">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-lg font-bold mt-3 text-foreground tracking-tight">{form.name || "Employee Name"}</h3>
              <p className="text-sm text-muted-foreground">{form.designation || "No designation"}</p>
              <Badge
                className={cn(
                  "mt-2 border-none px-4 py-1 font-bold rounded-lg text-xs",
                  form.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : form.status === "On Leave"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-slate-500/10 text-slate-600"
                )}
              >
                {form.status}
              </Badge>
              <div className="w-full mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-semibold text-foreground">{form.department || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold text-foreground truncate max-w-[160px]">{form.email || "—"}</span>
                </div>
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Joined</span>
                  <span className="font-semibold text-foreground">
                    {form.joiningDate
                      ? new Date(form.joiningDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                Quick Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                "Changes are saved directly to the database",
                "Email changes won't affect the employee's login",
                "Status changes are reflected across the system",
                "Use 'On Leave' for extended leave periods",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Departments */}
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
                  <span
                    key={dept}
                    className={cn(
                      "text-[11px] font-medium px-2.5 py-1 rounded-md",
                      form.department === dept || (dept === "HR" && form.department === "Human Resources")
                        ? "bg-indigo-500/10 text-indigo-500 font-bold"
                        : "text-muted-foreground bg-muted"
                    )}
                  >
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
