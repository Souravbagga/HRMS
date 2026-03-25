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
  const maxValue = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            fontWeight={500}
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
            allowDecimals={false}
            domain={[0, Math.ceil(maxValue * 1.2)]}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.3, radius: 8 }}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              borderColor: "hsl(var(--border))",
              borderRadius: "12px",
              boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
              fontSize: "13px",
              fontWeight: "600",
              padding: "8px 14px",
            }}
            labelStyle={{ fontWeight: 700, marginBottom: "2px" }}
            formatter={(value) => [`${value} employee${value !== 1 ? "s" : ""}`, "Present"]}
          />
          <Bar
            dataKey="total"
            fill="hsl(var(--primary))"
            radius={[8, 8, 0, 0]}
            barSize={36}
            animationDuration={600}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
