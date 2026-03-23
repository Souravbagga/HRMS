"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/notifications";
import type { Leave } from "@/types";

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("leaves")
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: false });

    if (filter === "pending") query = query.eq("status", "pending");

    const { data } = await query;
    setLeaves((data ?? []) as Leave[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchLeaves();
  }, [fetchLeaves]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    const supabase = createClient();
    await supabase.from("leaves").update({ status }).eq("id", id);

    // Notify the employee about their leave status
    const leave = leaves.find((l) => l.id === id);
    if (leave) {
      createNotification({
        userId: leave.user_id,
        title: `Leave ${status}`,
        message: `Your ${leave.leave_type} leave (${leave.start_date} → ${leave.end_date}) has been ${status}.`,
        type: status === "approved" ? "leave_approved" : "leave_rejected",
      });
    }

    await fetchLeaves();
    setActionLoading(null);
  }

  const pending = leaves.filter((l) => l.status === "pending").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-500">Leave Management</h1>
          <p className="text-muted-foreground mt-1">Review, approve and track employee time-off requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
        <div className="p-6 rounded-2xl bg-indigo-500 text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-between h-32">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Total Pending</h3>
          <div className="text-4xl font-black tracking-tighter">{loading ? "—" : String(pending).padStart(2, "0")}</div>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col justify-between h-32">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Requests</h3>
          <div className="text-4xl font-black tracking-tighter text-indigo-500">{loading ? "—" : String(leaves.length).padStart(2, "0")}</div>
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border/40 shadow-sm flex flex-col justify-between h-32">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Approved</h3>
          <div className="text-4xl font-black tracking-tighter text-emerald-500">
            {loading ? "—" : String(leaves.filter((l) => l.status === "approved").length).padStart(2, "0")}
          </div>
        </div>
      </div>

      <div className="flex bg-card flex-col border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/40 bg-muted/20 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Leave Requests</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-[10px] font-black uppercase tracking-widest rounded-lg h-7", filter === "all" && "bg-muted")}
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("text-[10px] font-black uppercase tracking-widest rounded-lg h-7 hover:bg-amber-500/10 hover:text-amber-600", filter === "pending" && "bg-amber-500/10 text-amber-600")}
              onClick={() => setFilter("pending")}
            >
              Pending only
            </Button>
          </div>
        </div>

        <div className="relative w-full overflow-auto text-foreground">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading requests...</span>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No leave requests found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="border-border/40">
                  <TableHead className="py-4 font-black uppercase tracking-tighter text-xs">Requester</TableHead>
                  <TableHead className="font-black uppercase tracking-tighter text-xs">Request Details</TableHead>
                  <TableHead className="font-black uppercase tracking-tighter text-xs text-center">Duration</TableHead>
                  <TableHead className="font-black uppercase tracking-tighter text-xs text-center">Status</TableHead>
                  <TableHead className="text-right font-black uppercase tracking-tighter text-xs pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.map((leave) => {
                  const name = leave.profiles?.name ?? "Employee";
                  const email = leave.profiles?.email ?? "";
                  const days =
                    Math.ceil(
                      (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1;

                  return (
                    <TableRow key={leave.id} className="group hover:bg-muted/20 transition-colors border-border/40">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                            <AvatarImage src="" />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-foreground text-sm">{name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-indigo-500 uppercase tracking-tight">{leave.leave_type}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground mt-1 whitespace-nowrap italic">
                            {leave.start_date} — {leave.end_date}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold text-foreground text-sm italic">{days} d</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          className={cn(
                            "rounded-[0.6rem] border-none px-4 py-0.5 font-bold shadow-sm text-[11px]",
                            leave.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : leave.status === "rejected"
                              ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600 border border-amber-500/10"
                          )}
                        >
                          {leave.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1">
                          {leave.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={actionLoading === leave.id}
                                onClick={() => updateStatus(leave.id, "approved")}
                                className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/5 shrink-0"
                              >
                                {actionLoading === leave.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={actionLoading === leave.id}
                                onClick={() => updateStatus(leave.id, "rejected")}
                                className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 border border-rose-500/5 shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted shrink-0">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
