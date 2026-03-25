"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import type { Attendance } from "@/types";

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const today = new Date().toISOString().split("T")[0];

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("attendance")
      .select("*, profiles(name, email)")
      .order("date", { ascending: false })
      .order("check_in", { ascending: false })
      .limit(200);

    if (error) {
      setError(error.message);
    } else {
      setRecords((data ?? []) as unknown as Attendance[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const todayRecords = records.filter((r) => r.date === today);
  const presentCount = todayRecords.filter(
    (r) => r.status === "Present" || r.status === "Late",
  ).length;
  const lateCount = records.filter((r) => r.status === "Late").length;

  const avgHours =
    records.length > 0
      ? (
          records.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) /
            (records.filter((r) => r.total_hours).length || 1)
        ).toFixed(1)
      : "0.0";

  const filteredRecords = statusFilter === "all"
    ? records
    : records.filter((r) => r.status === statusFilter);

  const columns: Column<Attendance>[] = [
    {
      key: "employee",
      header: "Employee",
      sortable: true,
      sortFn: (a, b) => (a.profiles?.name ?? "").localeCompare(b.profiles?.name ?? ""),
      cell: (rec) => <span className="font-semibold text-foreground">{rec.profiles?.name ?? "—"}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortFn: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      cell: (rec) => (
        <span className="text-muted-foreground font-medium text-sm">
          {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </span>
      ),
    },
    {
      key: "check_in",
      header: "Check In",
      headerClassName: "text-center",
      className: "text-center",
      cell: (rec) => (
        <span className="font-mono text-sm font-medium">
          {rec.check_in
            ? new Date(rec.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </span>
      ),
    },
    {
      key: "check_out",
      header: "Check Out",
      headerClassName: "text-center",
      className: "text-center",
      cell: (rec) => (
        <span className="font-mono text-sm font-medium">
          {rec.check_out
            ? new Date(rec.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "—"}
        </span>
      ),
    },
    {
      key: "total_hours",
      header: "Hours",
      headerClassName: "text-center",
      className: "text-center",
      sortable: true,
      sortFn: (a, b) => (a.total_hours ?? 0) - (b.total_hours ?? 0),
      cell: (rec) =>
        rec.total_hours ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/5 text-indigo-600 font-semibold text-xs border border-indigo-500/10">
            <Clock className="w-3 h-3" />
            {rec.total_hours}h
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      headerClassName: "text-right pr-6",
      className: "text-right pr-6",
      cell: (rec) => (
        <Badge
          className={cn(
            "rounded-lg border-none px-3 py-0.5 font-semibold text-xs",
            rec.status === "Present"
              ? "bg-emerald-500/10 text-emerald-600"
              : rec.status === "Late"
                ? "bg-amber-500/10 text-amber-600"
                : "bg-rose-500/10 text-rose-600",
          )}
        >
          {rec.status}
        </Badge>
      ),
    },
  ];

  const filterToolbar = (
    <div className="flex gap-1.5">
      {["all", "Present", "Late", "Absent"].map((status) => (
        <Button
          key={status}
          variant="ghost"
          size="sm"
          className={cn(
            "text-xs font-semibold rounded-lg h-8 px-3",
            statusFilter === status && "bg-muted text-foreground"
          )}
          onClick={() => setStatusFilter(status)}
        >
          {status === "all" ? "All" : status}
        </Button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Attendance</h1>
        <p className="text-muted-foreground mt-1">
          Track daily presence, working hours and punctuality.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard
            title="Average Work Hours"
            value={`${avgHours}h`}
            icon={CalendarCheck}
            iconColor="bg-indigo-500/10 text-indigo-500"
            trend={{ value: "Across all records", isPositive: true }}
            loading={loading}
          />
          <StatCard
            title="Late Check-ins"
            value={lateCount}
            icon={AlertTriangle}
            iconColor="bg-amber-500/10 text-amber-500"
            trend={{ value: "Total late arrivals", isPositive: lateCount === 0 }}
            loading={loading}
          />
          <StatCard
            title="Present Today"
            value={presentCount}
            icon={Clock}
            iconColor="bg-emerald-500/10 text-emerald-500"
            trend={{ value: today, isPositive: true }}
            loading={loading}
          />
        </div>

        <Card className="lg:col-span-4 rounded-2xl border-none shadow-sm bg-linear-to-br from-indigo-500 to-indigo-600 text-white p-2">
          <CardHeader>
            <CardTitle className="text-white/80 text-sm font-semibold">
              Today&apos;s Summary
            </CardTitle>
            <CardDescription className="text-white/60 text-xs">
              {today}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="text-5xl font-black mb-2 tracking-tighter">
              {loading ? "—" : presentCount}
            </div>
            <p className="text-white/60 text-sm font-medium mb-2">
              Employees Present
            </p>
            <div className="flex gap-4 mt-4 text-sm">
              <div className="text-center">
                <div className="font-black text-xl">
                  {loading ? "—" : todayRecords.filter(r => r.status === "Late").length}
                </div>
                <div className="text-white/60 text-xs">Late</div>
              </div>
              <div className="w-px bg-white/20" />
              <div className="text-center">
                <div className="font-black text-xl">
                  {loading ? "—" : todayRecords.filter((r) => r.status === "Absent").length}
                </div>
                <div className="text-white/60 text-xs">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={filteredRecords}
        loading={loading}
        error={error}
        onRetry={fetchAttendance}
        searchPlaceholder="Search by employee name..."
        searchFn={(rec, q) => (rec.profiles?.name ?? "").toLowerCase().includes(q)}
        emptyTitle="No attendance records"
        emptyDescription="Attendance records will appear here once employees start clocking in."
        emptyIcon={Clock}
        toolbar={filterToolbar}
        pageSize={15}
      />
    </div>
  );
}
