import { createClient } from "@/lib/supabaseServer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, Clock, UserCheck, TrendingUp, TrendingDown } from "lucide-react";
import { AttendanceChart } from "@/components/charts/attendance-chart";
import { RecentLeaves } from "@/components/dashboard/recent-leaves";
import { cn } from "@/lib/utils";
import type { Leave } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const [
    { count: totalEmployees },
    { count: presentToday },
    { count: onLeave },
    { count: pendingRequests },
    { data: recentLeaves },
    { data: weeklyAttendance },
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "Active"),
    supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).in("status", ["Present", "Late"]),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "approved").lte("start_date", today).gte("end_date", today),
    supabase.from("leaves").select("*", { count: "exact", head: true }).eq("status", "pending"),
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
  ]);

  const stats = [
    {
      title: "Total Employees",
      value: totalEmployees ?? 0,
      icon: Users,
      color: "bg-indigo-500/10 text-indigo-500",
      trend: "Active staff",
      trendUp: true,
    },
    {
      title: "Present Today",
      value: presentToday ?? 0,
      icon: Clock,
      color: "bg-emerald-500/10 text-emerald-500",
      trend: "Checked in",
      trendUp: true,
    },
    {
      title: "On Leave",
      value: onLeave ?? 0,
      icon: CalendarDays,
      color: "bg-amber-500/10 text-amber-500",
      trend: "Approved leaves",
      trendUp: false,
    },
    {
      title: "Pending Requests",
      value: pendingRequests ?? 0,
      icon: UserCheck,
      color: "bg-rose-500/10 text-rose-500",
      trend: "Awaiting review",
      trendUp: pendingRequests === 0,
    },
  ];

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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-2xl border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className={cn("p-2 rounded-xl", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                stat.trendUp ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}>
                {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {stat.trend}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight mt-1">{stat.value}</div>
              <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 rounded-2xl border-none shadow-sm p-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Attendance Trends</CardTitle>
            <CardDescription className="text-xs">Daily presence for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pt-4">
            <AttendanceChart data={chartData} />
          </CardContent>
        </Card>
        <Card className="col-span-3 rounded-2xl border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Recent Leave Requests</CardTitle>
            <CardDescription className="text-xs">Latest applications pending review</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentLeaves leaves={(recentLeaves ?? []) as Leave[]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
