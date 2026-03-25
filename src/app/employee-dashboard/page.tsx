"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Clock, CalendarDays, Loader2, LogIn, LogOut, Send, Timer, TrendingUp, Award, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";
import { notifyAdmins } from "@/lib/notifications";
import type { Attendance, Leave, LeaveType, LeaveBalance } from "@/types";

export default function EmployeeDashboardPage() {
  const profile = useUserStore((s) => s.profile);

  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [leaveError, setLeaveError] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "" as LeaveType | "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const supabase = createClient();

    const [{ data: todayAtt }, { data: history }, { data: myLeaves }, { data: empData }] = await Promise.all([
      supabase.from("attendance").select("*").eq("user_id", profile.id).eq("date", today).maybeSingle(),
      supabase.from("attendance").select("*").eq("user_id", profile.id).order("date", { ascending: false }).limit(20),
      supabase.from("leaves").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
      supabase.from("employees").select("id").eq("profile_id", profile.id).single(),
    ]);

    setTodayRecord(todayAtt as Attendance | null);
    setAttendanceHistory((history ?? []) as Attendance[]);
    setLeaves((myLeaves ?? []) as Leave[]);

    if (empData) {
      const { data: bal } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("employee_id", empData.id)
        .single();
      setBalance(bal as LeaveBalance | null);
    }

    setDataLoading(false);
  }, [profile, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleClockIn() {
    if (!profile) return;
    setClockLoading(true);
    const supabase = createClient();
    const now = new Date();
    const hour = now.getHours();
    const status = hour > 9 ? "Late" : "Present";

    const { data } = await supabase
      .from("attendance")
      .insert({ user_id: profile.id, date: today, check_in: now.toISOString(), status })
      .select()
      .single();

    setTodayRecord(data as Attendance);
    setClockLoading(false);
    notifyAdmins({
      title: `${profile.name} clocked in`,
      message: `Checked in at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${status === "Late" ? " (Late)" : ""}`,
      type: "clock_in",
    });
    fetchData();
  }

  async function handleClockOut() {
    if (!todayRecord) return;
    setClockLoading(true);
    const supabase = createClient();
    const now = new Date();
    const checkIn = new Date(todayRecord.check_in!);
    const totalHours = parseFloat(((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));

    await supabase
      .from("attendance")
      .update({ check_out: now.toISOString(), total_hours: totalHours })
      .eq("id", todayRecord.id);

    setClockLoading(false);
    notifyAdmins({
      title: `${profile?.name} clocked out`,
      message: `Total hours: ${totalHours}h`,
      type: "clock_out",
    });
    fetchData();
  }

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    setLeaveError("");
    if (!leaveForm.leaveType) { setLeaveError("Select a leave type."); return; }
    if (!leaveForm.startDate || !leaveForm.endDate) { setLeaveError("Select start and end dates."); return; }
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) { setLeaveError("End date must be after start date."); return; }
    if (!profile) return;

    // Check balance
    if (leaveForm.leaveType !== "Unpaid" && balance) {
      const days = Math.ceil(
        (new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      const key = leaveForm.leaveType.toLowerCase();
      const total = (balance as unknown as Record<string, number>)[`${key}_total`] ?? 0;
      const used = (balance as unknown as Record<string, number>)[`${key}_used`] ?? 0;
      const remaining = total - used;
      if (days > remaining) {
        setLeaveError(`Insufficient ${leaveForm.leaveType} leave balance. You have ${remaining} day(s) remaining but requested ${days}.`);
        return;
      }
    }

    setLeaveLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("leaves").insert({
      user_id: profile.id,
      leave_type: leaveForm.leaveType,
      start_date: leaveForm.startDate,
      end_date: leaveForm.endDate,
      reason: leaveForm.reason || null,
      status: "pending",
    });

    if (error) { setLeaveError(error.message); setLeaveLoading(false); return; }

    notifyAdmins({
      title: `${profile.name} applied for leave`,
      message: `${leaveForm.leaveType} leave: ${leaveForm.startDate} → ${leaveForm.endDate}`,
      type: "leave_applied",
    });
    setLeaveSuccess(true);
    setLeaveForm({ leaveType: "", startDate: "", endDate: "", reason: "" });
    setLeaveLoading(false);
    setTimeout(() => setLeaveSuccess(false), 3000);
    fetchData();
  }

  const approvedLeaves = leaves.filter((l) => l.status === "approved").length;
  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const isClockedIn = !!todayRecord?.check_in;
  const isClockedOut = !!todayRecord?.check_out;

  // Stats
  const totalHours = attendanceHistory.reduce((sum, a) => sum + (a.total_hours ?? 0), 0);
  const avgHours = attendanceHistory.length > 0 ? (totalHours / attendanceHistory.filter(a => a.total_hours).length || 0).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Welcome, {profile?.name?.split(" ")[0] ?? "Employee"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl shrink-0", isClockedIn && !isClockedOut ? "bg-emerald-500/10" : "bg-muted")}>
              <Clock className={cn("w-5 h-5", isClockedIn && !isClockedOut ? "text-emerald-500" : "text-muted-foreground")} />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">
                {dataLoading ? "—" : isClockedOut ? "Done" : isClockedIn ? "Active" : "Idle"}
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 shrink-0">
              <Timer className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{avgHours}h</p>
              <p className="text-[11px] text-muted-foreground font-medium">Avg Hours</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
              <CalendarDays className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{dataLoading ? "—" : pendingLeaves}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Pending Leaves</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 shrink-0">
              <Award className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{dataLoading ? "—" : approvedLeaves}</p>
              <p className="text-[11px] text-muted-foreground font-medium">Approved Leaves</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left content — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clock In / Out */}
          <Card className="border border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Attendance Clock
              </CardTitle>
              <CardDescription className="text-xs">{today}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                {isClockedOut ? (
                  <>
                    <div className="text-4xl font-bold tracking-tight text-foreground">{todayRecord?.total_hours}h</div>
                    <p className="text-muted-foreground text-sm mt-1">Total hours today</p>
                  </>
                ) : isClockedIn ? (
                  <>
                    <div className="text-2xl font-bold text-emerald-500">Clocked In</div>
                    <p className="text-muted-foreground text-sm mt-1">
                      Since {new Date(todayRecord!.check_in!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-foreground">Not Clocked In</div>
                    <p className="text-muted-foreground text-sm mt-1">Clock in to start your day</p>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  className="rounded-xl h-12 px-6 font-bold bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 gap-2"
                  disabled={isClockedIn || clockLoading || dataLoading}
                  onClick={handleClockIn}
                >
                  {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" />CLOCK IN</>}
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl h-12 px-6 font-bold hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 gap-2"
                  disabled={!isClockedIn || isClockedOut || clockLoading || dataLoading}
                  onClick={handleClockOut}
                >
                  {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4" />CLOCK OUT</>}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Attendance History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                My Attendance
              </CardTitle>
              <CardDescription className="text-xs">Your recent attendance records</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {dataLoading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : attendanceHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">No attendance records yet.</div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/40">
                        <TableHead className="font-bold text-foreground">Date</TableHead>
                        <TableHead className="font-bold text-foreground text-center">Check In</TableHead>
                        <TableHead className="font-bold text-foreground text-center">Check Out</TableHead>
                        <TableHead className="font-bold text-foreground text-center">Hours</TableHead>
                        <TableHead className="font-bold text-foreground text-right pr-6">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceHistory.slice(0, 10).map((rec) => (
                        <TableRow key={rec.id} className="hover:bg-muted/20 transition-colors border-border/40">
                          <TableCell className="font-medium">{rec.date}</TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </TableCell>
                          <TableCell className="text-center font-mono text-sm">
                            {rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </TableCell>
                          <TableCell className="text-center font-bold text-sm">
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
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar — 1/3 */}
        <div className="space-y-6">
          {/* Apply Leave */}
          <Card className="border border-border/60">
            <CardHeader>
              <CardTitle className="text-base font-bold">Apply for Leave</CardTitle>
              <CardDescription className="text-xs">Submit a new leave request</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleApplyLeave} className="space-y-4">
                {leaveError && (
                  <div className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                    {leaveError}
                  </div>
                )}
                {leaveSuccess && (
                  <div className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                    Leave request submitted successfully!
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Leave Type</Label>
                  <Select value={leaveForm.leaveType} onValueChange={(v) => v && setLeaveForm((p) => ({ ...p, leaveType: v as LeaveType }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {(["Annual", "Sick", "Casual", "Maternity", "Paternity", "Unpaid"] as const).map((type) => {
                        const remaining = type !== "Unpaid" && balance
                          ? ((balance as unknown as Record<string, number>)[`${type.toLowerCase()}_total`] ?? 0) - ((balance as unknown as Record<string, number>)[`${type.toLowerCase()}_used`] ?? 0)
                          : null;
                        return (
                          <SelectItem key={type} value={type}>
                            {type} {remaining !== null ? `(${remaining} left)` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {leaveForm.leaveType && leaveForm.leaveType !== "Unpaid" && balance && (
                    <p className="text-[11px] text-muted-foreground">
                      Balance: {((balance as unknown as Record<string, number>)[`${leaveForm.leaveType.toLowerCase()}_total`] ?? 0) - ((balance as unknown as Record<string, number>)[`${leaveForm.leaveType.toLowerCase()}_used`] ?? 0)} of {(balance as unknown as Record<string, number>)[`${leaveForm.leaveType.toLowerCase()}_total`] ?? 0} remaining
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">Start Date</Label>
                    <Input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm((p) => ({ ...p, startDate: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold">End Date</Label>
                    <Input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm((p) => ({ ...p, endDate: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Reason (optional)</Label>
                  <Textarea
                    placeholder="Brief reason..."
                    className="resize-none h-20"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                  />
                </div>

                <Button type="submit" disabled={leaveLoading} className="w-full rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all gap-2">
                  {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Request
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Leave Requests */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Recent Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dataLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : leaves.length === 0 ? (
                <p className="text-center py-6 text-muted-foreground text-xs">No leave requests yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {leaves.slice(0, 5).map((leave) => {
                    const days = Math.ceil(
                      (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)
                    ) + 1;
                    return (
                      <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{leave.leave_type} · {days}d</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(leave.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} → {new Date(leave.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-md border-none px-2 py-0.5 font-bold text-[10px]",
                            leave.status === "approved" ? "bg-emerald-500/10 text-emerald-600"
                              : leave.status === "rejected" ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600"
                          )}
                        >
                          {leave.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
