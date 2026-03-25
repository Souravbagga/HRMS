import { createClient } from "@/lib/supabaseServer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, Clock, UserCheck, Activity, Percent } from "lucide-react";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { RecentLeaves } from "@/components/dashboard/recent-leaves";
import { StatCard } from "@/components/ui/stat-card";
import type { Leave } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Get yesterday for comparison
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    { count: totalEmployees },
    { count: presentToday },
    { count: onLeave },
    { count: pendingRequests },
    { data: recentLeaves },
    { data: weeklyAttendance },
    { count: yesterdayPresent },
    { count: totalLeavesTaken },
  ] = await Promise.all([
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("status", "Active"),
    supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today).in("status", ["Present", "Late"]),
    supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "approved").lte("start_date", today).gte("end_date", today),
    supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("leaves")
      .select("*, profiles(name, email)")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("attendance")
      .select("date, status")
      .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("date", { ascending: true }),
    supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", yesterday).in("status", ["Present", "Late"]),
    supabase.from("leaves").select("id", { count: "exact", head: true }).eq("status", "approved"),
  ]);

  const empCount = totalEmployees ?? 0;
  const presentCount = presentToday ?? 0;
  const leaveCount = onLeave ?? 0;
  const pendingCount = pendingRequests ?? 0;
  const yPresent = yesterdayPresent ?? 0;

  // Calculate attendance rate
  const attendanceRate = empCount > 0 ? Math.round((presentCount / empCount) * 100) : 0;

  // Calculate leave usage rate
  const leaveUsageRate = totalLeavesTaken ?? 0;

  // Build chart data: group attendance by day of week
  const dayMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  (weeklyAttendance ?? []).forEach((rec) => {
    const day = dayNames[new Date(rec.date).getDay()];
    if (rec.status === "Present" || rec.status === "Late") dayMap[day]++;
  });
  const chartData = Object.entries(dayMap).map(([name, total]) => ({ name, total }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your workforce today.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={empCount}
          icon={Users}
          iconColor="bg-indigo-500/10 text-indigo-500"
          trend={{ value: "Active staff", isPositive: true }}
        />
        <StatCard
          title="Present Today"
          value={presentCount}
          icon={Clock}
          iconColor="bg-emerald-500/10 text-emerald-500"
          trend={{
            value: presentCount >= yPresent ? `+${presentCount - yPresent} vs yesterday` : `${presentCount - yPresent} vs yesterday`,
            isPositive: presentCount >= yPresent,
          }}
        />
        <StatCard
          title="On Leave"
          value={leaveCount}
          icon={CalendarDays}
          iconColor="bg-amber-500/10 text-amber-500"
          trend={{ value: `${attendanceRate}% attendance`, isPositive: attendanceRate >= 80 }}
        />
        <StatCard
          title="Pending Requests"
          value={pendingCount}
          icon={UserCheck}
          iconColor="bg-rose-500/10 text-rose-500"
          trend={{ value: pendingCount === 0 ? "All clear" : "Awaiting review", isPositive: pendingCount === 0 }}
        />
      </div>

      {/* Quick insights */}
      <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-2xl border-none shadow-sm bg-linear-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Activity className="w-6 h-6 mb-2 opacity-80" />
            <div className="text-3xl font-black tracking-tight">{attendanceRate}%</div>
            <p className="text-sm text-white/70 mt-1">Attendance Rate Today</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-linear-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Percent className="w-6 h-6 mb-2 opacity-80" />
            <div className="text-3xl font-black tracking-tight">{leaveUsageRate}</div>
            <p className="text-sm text-white/70 mt-1">Total Leaves Approved</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-linear-to-br from-amber-500 to-orange-500 text-white col-span-2 lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <CalendarDays className="w-6 h-6 mb-2 opacity-80" />
            <div className="text-3xl font-black tracking-tight">{pendingCount}</div>
            <p className="text-sm text-white/70 mt-1">Requests Need Action</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4 rounded-2xl border-none shadow-sm p-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Attendance Trends</CardTitle>
            <CardDescription className="text-xs">Daily presence for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pt-4">
            <AttendanceChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-full lg:col-span-3 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Leave Requests</CardTitle>
            <CardDescription className="text-xs">Latest applications pending review</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLeaves leaves={(recentLeaves ?? []) as unknown as Leave[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
