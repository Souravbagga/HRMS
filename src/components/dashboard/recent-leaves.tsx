"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Leave } from "@/types";

function statusStyle(status: string) {
  if (status === "approved") return "text-emerald-500 bg-emerald-500/10";
  if (status === "rejected") return "text-rose-500 bg-rose-500/10";
  return "text-amber-500 bg-amber-500/10";
}

export function RecentLeaves({ leaves = [] }: { leaves?: Leave[] }) {
  if (leaves.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No leave requests yet.</p>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full p-2 py-4">
      {leaves.map((leave) => {
        const name = leave.profiles?.name ?? "Employee";
        const email = leave.profiles?.email ?? "";
        const days =
          Math.ceil(
            (new Date(leave.end_date).getTime() - new Date(leave.start_date).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        return (
          <div
            key={leave.id}
            className="flex items-center group cursor-pointer hover:bg-muted/10 transition-all rounded-xl p-2 -mx-2"
          >
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm rounded-xl">
              <AvatarImage src="" alt={name} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 flex flex-col min-w-0">
              <p className="text-sm font-black leading-none text-foreground tracking-tight">{name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">
                  {leave.leave_type}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-[10px] font-black text-indigo-500 italic uppercase">
                  {days} day{days !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div
              className={cn(
                "ml-auto text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg shadow-sm border border-transparent",
                statusStyle(leave.status)
              )}
            >
              {leave.status}
            </div>
          </div>
        );
      })}
    </div>
  );
}
