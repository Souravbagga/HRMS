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
import { Clock, CalendarDays, CheckCircle2, Loader2, LogIn, LogOut, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";
import { notifyAdmins } from "@/lib/notifications";
import type { Attendance, Leave, LeaveType } from "@/types";

export default function EmployeeDashboardPage() {
  const profile = useUserStore((s) => s.profile);

  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<Attendance[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
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

    const [{ data: todayAtt }, { data: history }, { data: myLeaves }] = await Promise.all([
      supabase.from("attendance").select("*").eq("user_id", profile.id).eq("date", today).maybeSingle(),
      supabase.from("attendance").select("*").eq("user_id", profile.id).order("date", { ascending: false }).limit(20),
      supabase.from("leaves").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
    ]);

    setTodayRecord(todayAtt as Attendance | null);
    setAttendanceHistory((history ?? []) as Attendance[]);
    setLeaves((myLeaves ?? []) as Leave[]);
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Welcome, {profile?.name?.split(" ")[0] ?? "Employee"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={cn("p-3 rounded-2xl", isClockedIn && !isClockedOut ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Today</p>
              <p className="text-lg font-bold text-foreground mt-0.5">
                {dataLoading ? "—" : isClockedOut ? "Completed" : isClockedIn ? "Clocked In" : "Not Started"}
              </p>
              {todayRecord?.check_in && (
                <p className="text-xs text-muted-foreground">
                  In: {new Date(todayRecord.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {todayRecord.check_out && ` · Out: ${new Date(todayRecord.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pending Leaves</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{dataLoading ? "—" : pendingLeaves} request{pendingLeaves !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-card">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Approved Leaves</p>
              <p className="text-lg font-bold text-foreground mt-0.5">{dataLoading ? "—" : approvedLeaves} leave{approvedLeaves !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Clock In / Out */}
        <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-foreground text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Attendance Clock
            </CardTitle>
            <CardDescription className="text-xs">{today}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 text-center gap-6">
            <div className="text-center">
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

            <div className="flex w-full gap-3">
              <Button
                className="flex-1 rounded-xl h-12 font-bold transition-all disabled:opacity-50"
                disabled={isClockedIn || clockLoading || dataLoading}
                onClick={handleClockIn}
              >
                {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4 mr-2" />CLOCK IN</>}
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12 font-bold transition-all disabled:opacity-40"
                disabled={!isClockedIn || isClockedOut || clockLoading || dataLoading}
                onClick={handleClockOut}
              >
                {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" />CLOCK OUT</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Apply Leave */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Apply for Leave</CardTitle>
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
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Sick">Sick</SelectItem>
                    <SelectItem value="Casual">Casual</SelectItem>
                    <SelectItem value="Maternity">Maternity</SelectItem>
                    <SelectItem value="Paternity">Paternity</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
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

              <Button type="submit" disabled={leaveLoading} className="w-full rounded-xl font-bold">
                {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">My Attendance</CardTitle>
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
                  {attendanceHistory.map((rec) => (
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

      {/* Leave History */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">My Leave Requests</CardTitle>
          <CardDescription className="text-xs">All your submitted leave applications</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {dataLoading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No leave requests yet.</div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/40">
                    <TableHead className="font-bold text-foreground">Type</TableHead>
                    <TableHead className="font-bold text-foreground">Period</TableHead>
                    <TableHead className="font-bold text-foreground text-center">Days</TableHead>
                    <TableHead className="font-bold text-foreground">Reason</TableHead>
                    <TableHead className="font-bold text-foreground text-right pr-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => {
                    const days = Math.ceil(
                      (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)
                    ) + 1;
                    return (
                      <TableRow key={leave.id} className="hover:bg-muted/20 transition-colors border-border/40">
                        <TableCell className="font-bold text-indigo-500 text-sm">{leave.leave_type}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {leave.start_date} → {leave.end_date}
                        </TableCell>
                        <TableCell className="text-center font-bold">{days}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                          {leave.reason ?? "—"}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge
                            className={cn(
                              "rounded-lg border-none px-3 py-0.5 font-bold text-xs",
                              leave.status === "approved" ? "bg-emerald-500/10 text-emerald-600"
                                : leave.status === "rejected" ? "bg-rose-500/10 text-rose-600"
                                : "bg-amber-500/10 text-amber-600"
                            )}
                          >
                            {leave.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
