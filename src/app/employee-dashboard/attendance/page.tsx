"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Clock, CalendarCheck, AlertTriangle, Loader2, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import { useUserStore } from "@/store/userStore";
import { notifyAdmins } from "@/lib/notifications";
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
    const supabase = createClient();
    const now = new Date();
    const status = now.getHours() > 9 ? "Late" : "Present";

    await supabase
      .from("attendance")
      .insert({ user_id: profile.id, date: today, check_in: now.toISOString(), status })
      .select()
      .single();

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

  const isClockedIn = !!todayRecord?.check_in;
  const isClockedOut = !!todayRecord?.check_out;

  const totalDays = records.length;
  const lateDays = records.filter((r) => r.status === "Late").length;
  const avgHours = totalDays > 0
    ? (records.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) / records.filter((r) => r.total_hours).length || 0).toFixed(1)
    : "0.0";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">My Attendance</h1>
        <p className="text-muted-foreground mt-1">Track your daily clock-in, clock-out, and work hours.</p>
      </div>

      {/* Today's Clock Card */}
      <Card className="rounded-2xl border border-border/60 shadow-sm bg-card">
        <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
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
              className="rounded-xl h-12 px-6 font-bold disabled:opacity-50"
              disabled={isClockedIn || clockLoading || loading}
              onClick={handleClockIn}
            >
              {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogIn className="w-4 h-4 mr-2" />CLOCK IN</>}
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-12 px-6 font-bold disabled:opacity-40"
              disabled={!isClockedIn || isClockedOut || clockLoading || loading}
              onClick={handleClockOut}
            >
              {clockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" />CLOCK OUT</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total Days</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : totalDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Late Arrivals</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : lateDays}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Avg Hours</p>
              <p className="text-2xl font-bold text-foreground">{loading ? "—" : `${avgHours}h`}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card className="rounded-2xl border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Attendance History</CardTitle>
          <CardDescription className="text-xs">{loading ? "Loading..." : `${records.length} records`}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No attendance records yet. Clock in to get started!</div>
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
                  {records.map((rec) => (
                    <TableRow key={rec.id} className="hover:bg-muted/20 transition-colors border-border/40">
                      <TableCell className="font-medium">
                        {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </TableCell>
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
  );
}
