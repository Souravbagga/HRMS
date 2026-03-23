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
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabaseClient";
import type { LeaveType } from "@/types";

const BALANCES: Record<string, number> = {
  Annual: 12,
  Sick: 6,
  Casual: 4,
  Maternity: 90,
  Paternity: 7,
  Unpaid: 0,
};

export default function ApplyLeavePage() {
  const router = useRouter();
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link href="/leave" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Apply Leave</h1>
          <p className="text-muted-foreground">Submit a new leave application.</p>
        </div>
      </div>

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
                  <SelectItem value="Annual">Annual Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Casual">Casual Leave</SelectItem>
                  <SelectItem value="Maternity">Maternity Leave</SelectItem>
                  <SelectItem value="Paternity">Paternity Leave</SelectItem>
                  <SelectItem value="Unpaid">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
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
                  Balance: <span className="font-bold text-foreground">{leaveType ? `${BALANCES[leaveType]} days` : "—"}</span>
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Link href="/leave" className={buttonVariants({ variant: "outline" })}>Cancel</Link>
              <Button type="submit" disabled={loading || success}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit Application"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
