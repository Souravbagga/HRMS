"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CalendarDays, CheckCircle2, Clock, XCircle, Loader2, Send, Plus, Info, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";
import { notifyAdmins } from "@/lib/notifications";
import type { Leave, LeaveType, LeaveBalance } from "@/types";

export default function MyLeavesPage() {
  const profile = useUserStore((s) => s.profile);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [leaveError, setLeaveError] = useState("");
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    leaveType: "" as LeaveType | "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const supabase = createClient();

    const [{ data: leavesData }, { data: empData }] = await Promise.all([
      supabase
        .from("leaves")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id")
        .eq("profile_id", profile.id)
        .single(),
    ]);

    setLeaves((leavesData ?? []) as Leave[]);

    if (empData) {
      const { data: bal } = await supabase
        .from("leave_balances")
        .select("*")
        .eq("employee_id", empData.id)
        .single();
      setBalance(bal as LeaveBalance | null);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate remaining for a leave type
  function getBalanceField(field: string): number {
    if (!balance) return 0;
    return (balance as unknown as Record<string, number>)[field] ?? 0;
  }

  function getRemaining(type: string): number {
    const key = type.toLowerCase();
    return getBalanceField(`${key}_total`) - getBalanceField(`${key}_used`);
  }

  function getTotal(type: string): number {
    return getBalanceField(`${type.toLowerCase()}_total`);
  }

  function getUsed(type: string): number {
    return getBalanceField(`${type.toLowerCase()}_used`);
  }

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    setLeaveError("");
    if (!leaveForm.leaveType) { setLeaveError("Select a leave type."); return; }
    if (!leaveForm.startDate || !leaveForm.endDate) { setLeaveError("Select start and end dates."); return; }
    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) { setLeaveError("End date must be after start date."); return; }
    if (!profile) return;

    // Check balance
    if (leaveForm.leaveType !== "Unpaid") {
      const days = Math.ceil(
        (new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
      const remaining = getRemaining(leaveForm.leaveType);
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
    setShowForm(false);
    setTimeout(() => setLeaveSuccess(false), 3000);
    fetchData();
  }

  const approved = leaves.filter((l) => l.status === "approved").length;
  const pending = leaves.filter((l) => l.status === "pending").length;
  const rejected = leaves.filter((l) => l.status === "rejected").length;

  const leaveTypes = ["Annual", "Sick", "Casual", "Earned", "Maternity", "Paternity"] as const;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Leaves</h1>
          <p className="text-muted-foreground mt-1">View your leave history and submit new requests.</p>
        </div>
        <Button
          className="rounded-xl shadow-md bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all font-bold gap-2"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Apply for Leave"}
        </Button>
      </div>

      {leaveSuccess && (
        <div className="flex items-center gap-3 text-sm font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          Leave request submitted successfully! Your manager will review it shortly.
        </div>
      )}

      {/* Apply Leave Form */}
      {showForm && (
        <Card className="border-2 border-indigo-500/20 shadow-lg shadow-indigo-500/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold">New Leave Request</CardTitle>
            <CardDescription className="text-xs">Fill in the details below to submit your request.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              {leaveError && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                  {leaveError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Leave Type</Label>
                  <Select value={leaveForm.leaveType} onValueChange={(v) => v && setLeaveForm((p) => ({ ...p, leaveType: v as LeaveType }))}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {(["Annual", "Sick", "Casual", "Maternity", "Paternity", "Unpaid"] as const).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type} {type !== "Unpaid" && balance ? `(${getRemaining(type)} left)` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {leaveForm.leaveType && leaveForm.leaveType !== "Unpaid" && (
                    <p className="text-[11px] text-muted-foreground">
                      Balance: {getRemaining(leaveForm.leaveType)} of {getTotal(leaveForm.leaveType)} remaining
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Start Date</Label>
                  <Input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm((p) => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">End Date</Label>
                  <Input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm((p) => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>

              {leaveForm.startDate && leaveForm.endDate && new Date(leaveForm.endDate) >= new Date(leaveForm.startDate) && (
                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                  Duration: <strong className="text-foreground">
                    {Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s)
                  </strong>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Reason (optional)</Label>
                <Textarea
                  placeholder="Brief reason for leave..."
                  className="resize-none h-20"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                />
              </div>

              <Button type="submit" disabled={leaveLoading} className="rounded-xl font-bold bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all gap-2">
                {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left — Table — 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 shrink-0">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{loading ? "—" : pending}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{loading ? "—" : approved}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 shrink-0">
                  <XCircle className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-2xl font-black text-foreground">{loading ? "—" : rejected}</p>
                  <p className="text-[11px] text-muted-foreground font-medium">Rejected</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold">Leave History</CardTitle>
              <CardDescription className="text-xs">{loading ? "Loading..." : `${leaves.length} total requests`}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : leaves.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  No leave requests yet. Click &quot;Apply for Leave&quot; to submit your first request.
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-border/40">
                        <TableHead className="font-bold text-foreground">Type</TableHead>
                        <TableHead className="font-bold text-foreground">Period</TableHead>
                        <TableHead className="font-bold text-foreground text-center">Days</TableHead>
                        <TableHead className="font-bold text-foreground">Reason</TableHead>
                        <TableHead className="font-bold text-foreground text-center">Submitted</TableHead>
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
                              {new Date(leave.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              {" → "}
                              {new Date(leave.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </TableCell>
                            <TableCell className="text-center font-bold">{days}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {leave.reason ?? "—"}
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground">
                              {new Date(leave.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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

        {/* Right sidebar — 1/3 */}
        <div className="space-y-4">
          {/* Leave Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Leave Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : !balance ? (
                <p className="text-xs text-muted-foreground text-center py-4">No balance data available.</p>
              ) : (
                leaveTypes.map((type) => {
                  const total = getTotal(type);
                  const used = getUsed(type);
                  const remaining = total - used;
                  const percentage = total > 0 ? (used / total) * 100 : 0;
                  if (total === 0 && type === "Earned") return null;

                  return (
                    <div key={type} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">{type}</span>
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {remaining}/{total}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            percentage > 80 ? "bg-rose-500" : percentage > 50 ? "bg-amber-500" : "bg-indigo-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{used} used</span>
                        <span className="text-[10px] text-muted-foreground">{remaining} left</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Quick tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                Leave Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                "Submit leave requests at least 2 days in advance",
                "Sick leave requires a medical certificate for 3+ days",
                "Annual leave must be approved by your manager",
                "Unpaid leave is only granted in special circumstances",
                "Check your balance before applying for leave",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent activity */}
          {leaves.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-indigo-500" />
                  Recent Requests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {leaves.slice(0, 4).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground">{leave.leave_type}</p>
                      <p className="text-[11px] text-muted-foreground">{leave.start_date}</p>
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
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
