"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface ChartDataPoint {
  name: string;
  total: number;
}

const defaultData: ChartDataPoint[] = [
  { name: "Mon", total: 0 },
  { name: "Tue", total: 0 },
  { name: "Wed", total: 0 },
  { name: "Thu", total: 0 },
  { name: "Fri", total: 0 },
  { name: "Sat", total: 0 },
  { name: "Sun", total: 0 },
];

export function AttendanceChart({ data = defaultData }: { data?: ChartDataPoint[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dx={-5}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
              fontWeight: "600",
            }}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
            barSize={32}
            className="hover:opacity-80 transition-opacity"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
