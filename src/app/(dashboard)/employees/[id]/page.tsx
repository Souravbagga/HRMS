"use client";

import { useEffect, useState } from "react";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import {
  ArrowLeft, Mail, Briefcase, Calendar, Clock, Shield, Award,
  FileText, Loader2, AlertCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import type { Employee, Attendance, Leave } from "@/types";

export default function EmployeeProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: emp } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (!emp) { setNotFound(true); setLoading(false); return; }
      setEmployee(emp as Employee);

      // If employee has a profile_id, fetch their attendance and leaves
      if (emp.profile_id) {
        const [{ data: att }, { data: lvs }] = await Promise.all([
          supabase
            .from("attendance")
            .select("*")
            .eq("user_id", emp.profile_id)
            .order("date", { ascending: false })
            .limit(20),
          supabase
            .from("leaves")
            .select("*")
            .eq("user_id", emp.profile_id)
            .order("created_at", { ascending: false }),
        ]);
        setAttendance((att ?? []) as Attendance[]);
        setLeaves((lvs ?? []) as Leave[]);
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="font-medium">Loading employee profile...</span>
      </div>
    );
  }

  if (notFound || !employee) {
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

  const initials = employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const approvedLeaves = leaves.filter((l) => l.status === "approved");
  const annualLeaves = approvedLeaves.filter((l) => l.leave_type === "Annual").length;
  const sickLeaves = approvedLeaves.filter((l) => l.leave_type === "Sick").length;
  const otherLeaves = approvedLeaves.filter((l) => !["Annual", "Sick"].includes(l.leave_type)).length;

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full pb-20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/employees"
            className={buttonVariants({ variant: "ghost", size: "icon", className: "rounded-xl border border-border/40 bg-card hover:bg-muted" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Employee Profile</h1>
            <p className="text-muted-foreground mt-1">
              Viewing records for <span className="font-bold text-foreground">{employee.name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card className="rounded-2xl border border-border/60 shadow-sm">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center text-3xl font-bold text-foreground border border-border/40">
                {initials}
              </div>
              <h2 className="text-2xl font-bold mt-5 text-foreground tracking-tight">{employee.name}</h2>
              <p className="text-muted-foreground font-medium text-sm mt-1">
                {employee.designation ?? "Employee"}
              </p>

              <Badge
                className={cn(
                  "mt-3 border-none px-4 py-1 font-bold rounded-lg text-xs",
                  employee.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : employee.status === "On Leave"
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-slate-500/10 text-slate-600"
                )}
              >
                {employee.status}
              </Badge>

              <div className="w-full space-y-3 pt-6 mt-6 border-t border-border/40">
                <div className="flex items-center gap-3 text-sm font-medium text-left">
                  <div className="p-2 rounded-lg border border-border/40">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="truncate text-foreground/80">{employee.email}</span>
                </div>
                {employee.department && (
                  <div className="flex items-center gap-3 text-sm font-medium text-left">
                    <div className="p-2 rounded-lg border border-border/40">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-foreground/80">{employee.department}</span>
                  </div>
                )}
                {employee.joining_date && (
                  <div className="flex items-center gap-3 text-sm font-medium text-left">
                    <div className="p-2 rounded-lg border border-border/40">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className="text-foreground/80">
                      Joined {new Date(employee.joining_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column — Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6 w-full sm:w-auto overflow-x-auto h-auto p-1.5 gap-1">
              <TabsTrigger value="overview" className="gap-2 px-6 py-2.5">
                <Shield className="w-4 h-4" /> Overview
              </TabsTrigger>
              <TabsTrigger value="attendance" className="gap-2 px-6 py-2.5">
                <Clock className="w-4 h-4" /> Attendance
              </TabsTrigger>
              <TabsTrigger value="leave" className="gap-2 px-6 py-2.5">
                <Award className="w-4 h-4" /> Leave History
              </TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/10 border-b border-border/40 py-5">
                  <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-500" />
                    Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="space-y-1.5 p-4 rounded-2xl bg-muted/10 border border-border/20 hover:bg-muted/20 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Department</p>
                      <p className="font-black text-foreground text-lg italic">{employee.department ?? "—"}</p>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-2xl bg-muted/10 border border-border/20 hover:bg-muted/20 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Designation</p>
                      <p className="font-black text-foreground text-lg italic">{employee.designation ?? "—"}</p>
                    </div>
                    <div className="space-y-1.5 p-4 rounded-2xl bg-muted/10 border border-border/20 hover:bg-muted/20 transition-all">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joining Date</p>
                      <p className="font-black text-foreground text-lg italic">
                        {employee.joining_date
                          ? new Date(employee.joining_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                    <div className="space-y-1.5 border-l-4 border-indigo-500/30 pl-4 py-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</p>
                      <p className="font-bold text-foreground">{employee.status}</p>
                    </div>
                    <div className="space-y-1.5 border-l-4 border-emerald-500/30 pl-4 py-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Leaves Taken</p>
                      <p className="font-bold text-foreground">{leaves.length} request{leaves.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="space-y-1.5 border-l-4 border-amber-500/30 pl-4 py-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Attendance Records</p>
                      <p className="font-bold text-foreground">{attendance.length} day{attendance.length !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Attendance tab */}
            <TabsContent value="attendance" className="animate-in fade-in duration-300">
              <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden">
                <CardHeader className="border-b border-border/40">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Attendance History</CardTitle>
                  <CardDescription>{attendance.length} records found</CardDescription>
                </CardHeader>
                {attendance.length === 0 ? (
                  <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                    <Clock className="w-10 h-10 opacity-20 mb-3" />
                    <p className="text-sm font-medium">No attendance records yet</p>
                    {!employee.profile_id && (
                      <p className="text-xs mt-1 opacity-60">Employee has no linked account</p>
                    )}
                  </CardContent>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow className="border-border/40">
                          <TableHead className="font-bold text-foreground">Date</TableHead>
                          <TableHead className="font-bold text-foreground text-center">Check In</TableHead>
                          <TableHead className="font-bold text-foreground text-center">Check Out</TableHead>
                          <TableHead className="font-bold text-foreground text-center">Hours</TableHead>
                          <TableHead className="font-bold text-foreground text-right pr-6">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((rec) => (
                          <TableRow key={rec.id} className="hover:bg-muted/20 border-border/40">
                            <TableCell className="font-medium">{rec.date}</TableCell>
                            <TableCell className="text-center font-mono text-sm">
                              {rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </TableCell>
                            <TableCell className="text-center font-mono text-sm">
                              {rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {rec.total_hours ? `${rec.total_hours}h` : "—"}
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Badge
                                className={cn(
                                  "rounded-lg border-none px-3 py-0.5 font-bold text-xs",
                                  rec.status === "Present" ? "bg-emerald-500/10 text-emerald-600"
                                    : rec.status === "Late" ? "bg-amber-500/10 text-amber-600"
                                    : "bg-rose-500/10 text-rose-600"
                                )}
                              >
                                {rec.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Leave history tab */}
            <TabsContent value="leave" className="animate-in fade-in duration-300 space-y-6">
              <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-indigo-500/5 border-b border-border/40">
                  <CardTitle className="text-sm font-extrabold uppercase tracking-widest text-indigo-500">
                    Leave Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-3 gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-black text-indigo-500">{annualLeaves}</div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-muted-foreground">Annual Taken</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black text-amber-500">{sickLeaves}</div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-muted-foreground">Sick Taken</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-black text-rose-500">{otherLeaves}</div>
                      <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-muted-foreground">Other</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {leaves.length === 0 ? (
                <Card className="rounded-[1.5rem] border-none shadow-sm">
                  <CardContent className="flex flex-col items-center py-16 text-muted-foreground">
                    <Award className="w-10 h-10 opacity-20 mb-3" />
                    <p className="text-sm font-medium">No leave requests found</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {leaves.map((leave) => {
                    const days = Math.ceil(
                      (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)
                    ) + 1;
                    return (
                      <div
                        key={leave.id}
                        className="bg-card p-5 rounded-2xl border border-border/40 shadow-sm flex items-center justify-between hover:border-indigo-500/30 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
                            <Calendar className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground">{leave.leave_type} Leave</span>
                            <span className="text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-tight italic opacity-60">
                              {leave.start_date} → {leave.end_date} ({days} day{days !== 1 ? "s" : ""})
                            </span>
                            {leave.reason && (
                              <span className="text-xs text-muted-foreground mt-0.5">{leave.reason}</span>
                            )}
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-lg border-none px-4 font-bold",
                            leave.status === "approved" ? "bg-emerald-500/10 text-emerald-600"
                              : leave.status === "rejected" ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600"
                          )}
                        >
                          {leave.status.toUpperCase()}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
