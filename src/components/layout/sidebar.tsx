"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import {
  Users,
  LayoutDashboard,
  CalendarDays,
  Clock,
  Settings,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Employees", href: "/employees", icon: Users },
  { name: "Leave Management", href: "/leave", icon: CalendarDays },
  { name: "Attendance", href: "/attendance", icon: Clock },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const profile = useUserStore((s) => s.profile);

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <aside
      className={cn(
        "flex flex-col w-64 border-r bg-sidebar border-sidebar-border min-h-screen",
        className
      )}
    >
      <div className="p-6 mb-2">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="bg-primary rounded-lg p-1.5">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">HRMS.pro</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4 mt-2">
          Admin Panel
        </div>
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all group duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                  isActive ? "text-white" : "text-muted-foreground"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 bg-secondary/50 p-3 rounded-2xl border border-border/50">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 font-bold shadow-sm text-sm">
            {initials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate text-foreground leading-none">
              {profile?.name ?? "Loading..."}
            </span>
            <span className="text-[10px] text-muted-foreground truncate mt-1">
              {profile?.email ?? ""}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
