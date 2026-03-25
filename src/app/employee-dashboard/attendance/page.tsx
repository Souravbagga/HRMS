"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CalendarCheck, AlertTriangle, Loader2, LogIn, LogOut, Timer, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";
import { notifyAdmins } from "@/lib/notifications";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "sonner";
import type { Attendance } from "@/types";

export default function MyAttendancePage() {
  const profile = useUserStore((s) => s.profile);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [todayRecord, setTodayRecord] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockLoading, setClockLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const fetchData = useCallback(async () => {
    if (!profile) return;
    const supabase = createClient();

    const [{ data: history }, { data: todayAtt }] = await Promise.all([
      supabase
        .from("attendance")
        .select("*")
        .eq("user_id", profile.id)
        .order("date", { ascending: false })
        .limit(50),
      supabase
        .from("attendance")
        .select("*")
        .eq("user_id", profile.id)
        .eq("date", today)
        .maybeSingle(),
    ]);

    setRecords((history ?? []) as Attendance[]);
    setTodayRecord(todayAtt as Attendance | null);
    setLoading(false);
  }, [profile, today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleClockIn() {
    if (!profile) return;
    setClockLoading(true);
    try {
      const supabase = createClient();
      const now = new Date();
      const status = now.getHours() > 9 ? "Late" : "Present";

      await supabase
        .from("attendance")
        .insert({ user_id: profile.id, date: today, check_in: now.toISOString(), status })
        .select()
        .single();

      toast.success(`Clocked in at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      notifyAdmins({
        title: `${profile.name} clocked in`,
        message: `Checked in at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${status === "Late" ? " (Late)" : ""}`,
        type: "clock_in",
      });
      fetchData();
    } catch {
      toast.error("Failed to clock in.");
    } finally {
      setClockLoading(false);
    }
  }

  async function handleClockOut() {
    if (!todayRecord) return;
    setClockLoading(true);
    try {
      const supabase = createClient();
      const now = new Date();
      const checkIn = new Date(todayRecord.check_in!);
      const totalHours = parseFloat(((now.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));

      await supabase
        .from("attendance")
        .update({ check_out: now.toISOString(), total_hours: totalHours })
        .eq("id", todayRecord.id);

      toast.success(`Clocked out. Total: ${totalHours}h`);
      notifyAdmins({
        title: `${profile?.name} clocked out`,
        message: `Total hours: ${totalHours}h`,
        type: "clock_out",
      });
      fetchData();
    } catch {
      toast.error("Failed to clock out.");
    } finally {
      setClockLoading(false);
    }
  }

  const isClockedIn = !!todayRecord?.check_in;
  const isClockedOut = !!todayRecord?.check_out;

  const presentDays = records.filter((r) => r.status === "Present").length;
  const lateDays = records.filter((r) => r.status === "Late").length;
  const avgHours = records.length > 0
    ? (records.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) / (records.filter((r) => r.total_hours).length || 1)).toFixed(1)
    : "0.0";

  const columns: Column<Attendance>[] = [
    {
      key: "date",
      header: "Date",
      sortable: true,
      sortFn: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      cell: (rec) => (
        <span className="font-medium text-sm">
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
        <span className="font-mono text-sm">
          {rec.check_in ? new Date(rec.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
      ),
    },
    {
      key: "check_out",
      header: "Check Out",
      headerClassName: "text-center",
      className: "text-center",
      cell: (rec) => (
        <span className="font-mono text-sm">
          {rec.check_out ? new Date(rec.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
        </span>
      ),
    },
    {
      key: "hours",
      header: "Hours",
      headerClassName: "text-center",
      className: "text-center",
      sortable: true,
      sortFn: (a, b) => (a.total_hours ?? 0) - (b.total_hours ?? 0),
      cell: (rec) => <span className="font-semibold text-sm">{rec.total_hours ? `${rec.total_hours}h` : "—"}</span>,
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
            rec.status === "Present" ? "bg-emerald-500/10 text-emerald-600"
              : rec.status === "Late" ? "bg-amber-500/10 text-amber-600"
              : "bg-rose-500/10 text-rose-600"
          )}
        >
          {rec.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Attendance</h1>
        <p className="text-muted-foreground mt-1">Track your daily clock-in, clock-out, and work hours.</p>
      </div>

      {/* Today's Clock Card */}
      <Card className="border border-border/60">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className={cn(
              "p-4 rounded-2xl",
              isClockedIn && !isClockedOut ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
            )}>
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Today — {today}</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {loading ? "Loading..." : isClockedOut ? `${todayRecord?.total_hours}h Total` : isClockedIn ? "Clocked In" : "Not Started"}
              </p>
              {todayRecord?.check_in && (
                <p className="text-muted-foreground text-sm mt-1">
                  In: {new Date(todayRecord.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {todayRecord.check_out && ` · Out: ${new Date(todayRecord.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="rounded-xl h-12 px-6 font-bold bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 gap-2"
              disabled={isClockedIn || clockLoading || loading}
              onClick={handleClockIn}
              aria-label="Clock in"
            >
              {clockLoading && !isClockedIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4" />CLOCK IN</>}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-12 px-6 font-bold hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-40 gap-2"
              disabled={!isClockedIn || isClockedOut || clockLoading || loading}
              onClick={handleClockOut}
              aria-label="Clock out"
            >
              {clockLoading && isClockedIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4" />CLOCK OUT</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Days" value={records.length} icon={CalendarCheck} iconColor="bg-indigo-500/10 text-indigo-500" loading={loading} />
        <StatCard title="Present" value={presentDays} icon={CheckCircle2} iconColor="bg-emerald-500/10 text-emerald-500" loading={loading} />
        <StatCard title="Late Arrivals" value={lateDays} icon={AlertTriangle} iconColor="bg-amber-500/10 text-amber-500" loading={loading} />
        <StatCard title="Avg Hours" value={`${avgHours}h`} icon={Timer} iconColor="bg-indigo-500/10 text-indigo-500" loading={loading} />
      </div>

      {/* Attendance Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        searchable={false}
        emptyTitle="No attendance records yet"
        emptyDescription="Clock in to start tracking your attendance."
        emptyIcon={Clock}
        pageSize={15}
      />

      {/* Attendance Policy */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" />
            Attendance Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              "Clock in before 9:00 AM to be marked as Present",
              "Clock in after 9:00 AM will be marked as Late",
              "Don't forget to clock out at the end of your day",
              "Total hours are calculated automatically",
              "Contact HR if you have any attendance issues",
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
