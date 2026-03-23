"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, AlertTriangle, CalendarCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabaseClient";
import type { Attendance } from "@/types";

export default function AttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    async function fetchAttendance() {
      const supabase = createClient();
      const { data } = await supabase
        .from("attendance")
        .select("*, profiles(name, email)")
        .order("date", { ascending: false })
        .order("check_in", { ascending: false })
        .limit(100);
      setRecords((data ?? []) as Attendance[]);
      setLoading(false);
    }
    fetchAttendance();
  }, []);

  const todayRecords = records.filter((r) => r.date === today);
  const presentCount = todayRecords.filter((r) => r.status === "Present" || r.status === "Late").length;
  const lateCount = records.filter((r) => r.status === "Late").length;

  const avgHours =
    records.length > 0
      ? (records.reduce((sum, r) => sum + (r.total_hours ?? 0), 0) / records.filter((r) => r.total_hours).length || 0).toFixed(1)
      : "0.0";

  const stats = [
    { title: "Average Work Hours", value: `${avgHours}h`, icon: CalendarCheck, sub: "Across all records" },
    { title: "Late Check-ins", value: String(lateCount), icon: AlertTriangle, sub: "Total late arrivals" },
    { title: "Present Today", value: String(presentCount), icon: Clock, sub: `${today}` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-500">Attendance</h1>
          <p className="text-muted-foreground mt-1">Track daily presence, working hours and punctuality.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((s) => (
            <Card key={s.title} className="rounded-2xl border-none shadow-sm bg-card hover:-translate-y-0.5 transition-transform">
              <CardContent className="p-6 flex flex-col items-center text-center h-full justify-center">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
                  <s.icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{s.title}</h3>
                <div className="text-3xl font-black mt-2 text-foreground">{loading ? "—" : s.value}</div>
                <p className="text-[11px] text-muted-foreground/60 mt-2 font-semibold italic">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-4 rounded-2xl border border-border/60 shadow-sm bg-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-foreground">Today&apos;s Summary</CardTitle>
            <CardDescription className="text-xs">{today}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 text-center">
            <div className="text-5xl font-black mb-2 tracking-tighter text-foreground">{loading ? "—" : presentCount}</div>
            <p className="text-muted-foreground text-sm font-medium mb-2">Employees Present</p>
            <div className="flex gap-6 mt-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-xl text-amber-500">{loading ? "—" : lateCount}</div>
                <div className="text-muted-foreground text-xs">Late</div>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <div className="font-bold text-xl text-rose-500">{loading ? "—" : todayRecords.filter((r) => r.status === "Absent").length}</div>
                <div className="text-muted-foreground text-xs">Absent</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex bg-card flex-col border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border/40 bg-muted/20 flex justify-between items-center">
          <h3 className="font-bold text-foreground">Detailed Logs</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3">
              Present: {presentCount}
            </Badge>
            <Badge variant="outline" className="bg-rose-500/5 text-rose-600 border-rose-500/20 px-3">
              Late: {lateCount}
            </Badge>
          </div>
        </div>

        <div className="relative w-full overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Loading attendance records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No attendance records yet.</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/40">
                  <TableHead className="font-bold text-foreground py-4">Employee</TableHead>
                  <TableHead className="font-bold text-foreground">Date</TableHead>
                  <TableHead className="font-bold text-foreground text-center">Check In</TableHead>
                  <TableHead className="font-bold text-foreground text-center">Check Out</TableHead>
                  <TableHead className="font-bold text-foreground text-center">Total Hours</TableHead>
                  <TableHead className="font-bold text-foreground text-right pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="group hover:bg-muted/20 transition-colors border-border/40">
                    <TableCell className="font-bold text-foreground py-4">
                      {record.profiles?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium">{record.date}</TableCell>
                    <TableCell className="text-center font-mono text-sm font-bold">
                      {record.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </TableCell>
                    <TableCell className="text-center font-mono text-sm font-bold">
                      {record.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.total_hours ? (
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/5 text-indigo-600 font-bold text-xs border border-indigo-500/10">
                          <Clock className="w-3 h-3" />
                          {record.total_hours}h
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Badge
                        className={cn(
                          "rounded-lg border-none px-4 py-1 font-bold",
                          record.status === "Present"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : record.status === "Late"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-rose-500/10 text-rose-600"
                        )}
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
