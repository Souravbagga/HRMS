"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Loader2, Calendar, Info, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import type { LeaveType, LeaveBalance } from "@/types";

export default function ApplyLeavePage() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setBalanceLoading(false); return; }

      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("profile_id", user.id)
        .single();

      if (emp) {
        const { data: bal } = await supabase
          .from("leave_balances")
          .select("*")
          .eq("employee_id", emp.id)
          .single();
        setBalance(bal as LeaveBalance | null);
      }
      setBalanceLoading(false);
    }
    fetchBalance();
  }, []);

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

  const days =
    startDate && endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1
        )
      : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!leaveType) { setError("Please select a leave type."); return; }
    if (!startDate || !endDate) { setError("Please select start and end dates."); return; }
    if (new Date(endDate) < new Date(startDate)) { setError("End date must be after start date."); return; }

    // Check balance
    if (leaveType !== "Unpaid" && balance) {
      const remaining = getRemaining(leaveType);
      if (days > remaining) {
        setError(`Insufficient ${leaveType} leave balance. You have ${remaining} day(s) remaining but requested ${days}.`);
        return;
      }
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { setError("Not authenticated."); setLoading(false); return; }

    const { error: insertError } = await supabase.from("leaves").insert({
      user_id: user.id,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason: reason || null,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/leave"), 1200);
  }

  const leaveTypes = ["Annual", "Sick", "Casual", "Maternity", "Paternity", "Unpaid"] as const;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-4">
        <Link href="/leave" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply Leave</h1>
          <p className="text-muted-foreground">Submit a new leave application.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main form — 2/3 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Leave Details</CardTitle>
              <CardDescription>Please provide the details for your leave request.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="text-sm font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-sm font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                    Leave request submitted! Redirecting...
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="leaveType">Leave Type</Label>
                  <Select onValueChange={(v) => v && setLeaveType(v as LeaveType)}>
                    <SelectTrigger id="leaveType">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => {
                        const remaining = type !== "Unpaid" && balance ? getRemaining(type) : null;
                        return (
                          <SelectItem key={type} value={type}>
                            {type} Leave {remaining !== null ? `(${remaining} left)` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {leaveType && leaveType !== "Unpaid" && balance && (
                    <p className="text-xs text-muted-foreground">
                      Balance: <strong className="text-foreground">{getRemaining(leaveType)}</strong> of {getTotal(leaveType)} days remaining
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Leave</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly explain the reason for your leave request..."
                    className="resize-none h-32"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>

                <div className="bg-muted p-4 rounded-xl flex justify-between items-center text-sm">
                  <div className="flex gap-6">
                    <span className="text-muted-foreground">
                      Duration: <span className="font-bold text-foreground">{days > 0 ? `${days} day${days !== 1 ? "s" : ""}` : "—"}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Remaining: <span className="font-bold text-foreground">
                        {leaveType && leaveType !== "Unpaid" && balance ? `${getRemaining(leaveType)} days` : "—"}
                      </span>
                    </span>
                    {leaveType && leaveType !== "Unpaid" && balance && days > 0 && (
                      <span className={cn("font-bold", days > getRemaining(leaveType) ? "text-rose-500" : "text-emerald-500")}>
                        {days > getRemaining(leaveType) ? "Exceeds balance!" : "Within balance"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Link href="/leave" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
                  <Button type="submit" disabled={loading || success} className="bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all">
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Application"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — 1/3 */}
        <div className="space-y-4">
          {/* Leave Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Your Leave Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {balanceLoading ? (
                <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : !balance ? (
                <p className="text-xs text-muted-foreground text-center py-4">No balance data available.</p>
              ) : (
                (["Annual", "Sick", "Casual", "Earned", "Maternity", "Paternity"] as const).map((type) => {
                  const total = getTotal(type);
                  const remaining = getRemaining(type);
                  const used = total - remaining;
                  const pct = total > 0 ? (used / total) * 100 : 0;
                  if (total === 0 && type === "Earned") return null;

                  return (
                    <div key={type} className={cn("p-3 rounded-lg", leaveType === type ? "bg-indigo-500/10 border border-indigo-500/20" : "bg-muted/30")}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">{type}</span>
                        <span className="text-[11px] font-bold text-muted-foreground">{remaining}/{total}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : "bg-indigo-500"
                          )}
                          style={{ width: `${pct}%` }}
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

          {/* Tips */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-500" />
                Leave Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                "Submit requests at least 2 days in advance",
                "Sick leave over 3 days requires a medical certificate",
                "Annual leave must be approved by your manager",
                "Leave balance is deducted upon approval",
                "Rejected leaves do not affect your balance",
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
