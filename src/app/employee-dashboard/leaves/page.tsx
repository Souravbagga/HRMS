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
  CalendarDays, CheckCircle2, Clock, XCircle, Loader2, Send, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";
import { notifyAdmins } from "@/lib/notifications";
import type { Leave, LeaveType } from "@/types";

export default function MyLeavesPage() {
  const profile = useUserStore((s) => s.profile);
  const [leaves, setLeaves] = useState<Leave[]>([]);
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

  const fetchLeaves = useCallback(async () => {
    if (!profile) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("leaves")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    setLeaves((data ?? []) as Leave[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

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
    setShowForm(false);
    setTimeout(() => setLeaveSuccess(false), 3000);
    fetchLeaves();
  }

  const approved = leaves.filter((l) => l.status === "approved").length;
  const pending = leaves.filter((l) => l.status === "pending").length;
  const rejected = leaves.filter((l) => l.status === "rejected").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Leaves</h1>
          <p className="text-muted-foreground mt-1">View your leave history and submit new requests.</p>
        </div>
        <Button
          className="rounded-xl shadow-md"
          onClick={() => setShowForm((v) => !v)}
        >
          <Plus className="w-4 h-4 mr-2" />
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
        <Card className="rounded-2xl border-2 border-indigo-500/20 shadow-lg shadow-indigo-500/5">
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
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="Sick">Sick</SelectItem>
                      <SelectItem value="Casual">Casual</SelectItem>
                      <SelectItem value="Maternity">Maternity</SelectItem>
                      <SelectItem value="Paternity">Paternity</SelectItem>
                      <SelectItem value="Unpaid">Unpaid</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Reason (optional)</Label>
                <Textarea
                  placeholder="Brief reason for leave..."
                  className="resize-none h-20"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm((p) => ({ ...p, reason: e.target.value }))}
                />
              </div>

              <Button type="submit" disabled={leaveLoading} className="rounded-xl font-bold">
                {leaveLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave History Table */}
      <Card className="rounded-2xl border-none shadow-sm">
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
  );
}
