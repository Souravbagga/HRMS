"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, CalendarDays, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { createNotification } from "@/lib/notifications";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "sonner";
import type { Leave } from "@/types";

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    let query = supabase
      .from("leaves")
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: false });

    if (filter === "pending") query = query.eq("status", "pending");

    const { data, error } = await query;
    if (error) {
      setError(error.message);
    } else {
      setLeaves((data ?? []) as unknown as Leave[]);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setActionLoading(id);
    const supabase = createClient();
    const leave = leaves.find((l) => l.id === id);

    // If approving, check and update leave balance
    if (leave && status === "approved" && leave.leave_type !== "Unpaid") {
      const days = Math.ceil(
        (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("profile_id", leave.user_id)
        .single();

      if (emp) {
        const typeKey = leave.leave_type.toLowerCase() as string;
        const usedCol = `${typeKey}_used`;
        const totalCol = `${typeKey}_total`;

        const { data: balance } = await supabase
          .from("leave_balances")
          .select("*")
          .eq("employee_id", emp.id)
          .single();

        if (balance) {
          const currentUsed = (balance as Record<string, number>)[usedCol] ?? 0;
          const total = (balance as Record<string, number>)[totalCol] ?? 0;
          const remaining = total - currentUsed;

          if (days > remaining) {
            setActionLoading(null);
            toast.error(`Cannot approve: Employee only has ${remaining} ${leave.leave_type} leave days remaining (requested ${days}).`);
            return;
          }

          await supabase
            .from("leave_balances")
            .update({ [usedCol]: currentUsed + days })
            .eq("employee_id", emp.id);
        }
      }
    }

    // If rejecting a previously approved leave, restore balance
    if (leave && status === "rejected" && leave.status === "approved" && leave.leave_type !== "Unpaid") {
      const days = Math.ceil(
        (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      const { data: emp } = await supabase
        .from("employees")
        .select("id")
        .eq("profile_id", leave.user_id)
        .single();

      if (emp) {
        const typeKey = leave.leave_type.toLowerCase() as string;
        const usedCol = `${typeKey}_used`;

        const { data: balance } = await supabase
          .from("leave_balances")
          .select("*")
          .eq("employee_id", emp.id)
          .single();

        if (balance) {
          const currentUsed = (balance as Record<string, number>)[usedCol] ?? 0;
          await supabase
            .from("leave_balances")
            .update({ [usedCol]: Math.max(0, currentUsed - days) })
            .eq("employee_id", emp.id);
        }
      }
    }

    await supabase.from("leaves").update({ status }).eq("id", id);

    if (leave) {
      createNotification({
        userId: leave.user_id,
        title: `Leave ${status}`,
        message: `Your ${leave.leave_type} leave (${leave.start_date} → ${leave.end_date}) has been ${status}.`,
        type: status === "approved" ? "leave_approved" : "leave_rejected",
      });
    }

    toast.success(`Leave request ${status} successfully.`);
    await fetchLeaves();
    setActionLoading(null);
  }

  const pending = leaves.filter((l) => l.status === "pending").length;
  const approved = leaves.filter((l) => l.status === "approved").length;

  const columns: Column<Leave>[] = [
    {
      key: "requester",
      header: "Requester",
      sortable: true,
      sortFn: (a, b) => (a.profiles?.name ?? "").localeCompare(b.profiles?.name ?? ""),
      cell: (leave) => {
        const name = leave.profiles?.name ?? "Employee";
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-background shadow-sm">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs font-semibold">{name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-foreground text-sm">{name}</span>
          </div>
        );
      },
    },
    {
      key: "details",
      header: "Details",
      cell: (leave) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-tight">{leave.leave_type}</span>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {new Date(leave.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" — "}
            {new Date(leave.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      headerClassName: "text-center",
      className: "text-center",
      sortable: true,
      sortFn: (a, b) => {
        const aDays = Math.ceil((new Date(a.end_date).getTime() - new Date(a.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const bDays = Math.ceil((new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return aDays - bDays;
      },
      cell: (leave) => {
        const days = Math.ceil(
          (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        return <span className="font-semibold text-sm">{days}d</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-center",
      className: "text-center",
      cell: (leave) => (
        <Badge
          className={cn(
            "rounded-lg border-none px-3 py-0.5 font-semibold text-xs",
            leave.status === "approved"
              ? "bg-emerald-500/10 text-emerald-600"
              : leave.status === "rejected"
              ? "bg-rose-500/10 text-rose-600"
              : "bg-amber-500/10 text-amber-600"
          )}
        >
          {leave.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right pr-6",
      className: "text-right pr-4",
      cell: (leave) => (
        <div className="flex items-center justify-end gap-1">
          {leave.status === "pending" && (
            <>
              <Button
                variant="ghost"
                size="icon"
                disabled={actionLoading === leave.id}
                onClick={() => updateStatus(leave.id, "approved")}
                className="h-8 w-8 rounded-lg text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/10 shrink-0"
                aria-label="Approve leave"
              >
                {actionLoading === leave.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={actionLoading === leave.id}
                onClick={() => updateStatus(leave.id, "rejected")}
                className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 border border-rose-500/10 shrink-0"
                aria-label="Reject leave"
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
          {leave.status !== "pending" && (
            <span className="text-xs text-muted-foreground font-medium capitalize">{leave.status}</span>
          )}
        </div>
      ),
    },
  ];

  const filterToolbar = (
    <div className="flex gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        className={cn("text-xs font-semibold rounded-lg h-8 px-3", filter === "all" && "bg-muted")}
        onClick={() => setFilter("all")}
      >
        All
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "text-xs font-semibold rounded-lg h-8 px-3",
          filter === "pending" && "bg-amber-500/10 text-amber-600"
        )}
        onClick={() => setFilter("pending")}
      >
        Pending ({pending})
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Leave Management</h1>
        <p className="text-muted-foreground mt-1">Review, approve and track employee time-off requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Total Pending"
          value={pending}
          icon={CalendarDays}
          iconColor="bg-amber-500/10 text-amber-500"
          trend={{ value: pending > 0 ? "Needs review" : "All clear", isPositive: pending === 0 }}
          loading={loading}
        />
        <StatCard
          title="Total Requests"
          value={leaves.length}
          icon={CalendarDays}
          iconColor="bg-indigo-500/10 text-indigo-500"
          trend={{ value: "All time", isPositive: true }}
          loading={loading}
        />
        <StatCard
          title="Approved"
          value={approved}
          icon={Check}
          iconColor="bg-emerald-500/10 text-emerald-500"
          trend={{ value: `${leaves.length > 0 ? Math.round((approved / leaves.length) * 100) : 0}% approval rate`, isPositive: true }}
          loading={loading}
        />
      </div>

      <DataTable
        columns={columns}
        data={leaves}
        loading={loading}
        error={error}
        onRetry={fetchLeaves}
        searchPlaceholder="Search by employee name..."
        searchFn={(leave, q) => (leave.profiles?.name ?? "").toLowerCase().includes(q)}
        emptyTitle="No leave requests"
        emptyDescription="Leave requests will appear here when employees submit them."
        emptyIcon={CalendarDays}
        toolbar={filterToolbar}
        pageSize={12}
      />
    </div>
  );
}
