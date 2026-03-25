"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { ModeToggle } from "@/components/mode-toggle";
import { UserNav } from "@/components/layout/user-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import {
  ShieldCheck,
  LayoutDashboard,
  Clock,
  CalendarDays,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";

const navItems = [
  { name: "Overview", href: "/employee-dashboard", icon: LayoutDashboard },
  {
    name: "My Attendance",
    href: "/employee-dashboard/attendance",
    icon: Clock,
  },
  { name: "My Leaves", href: "/employee-dashboard/leaves", icon: CalendarDays },
  { name: "Settings", href: "/employee-dashboard/settings", icon: Settings },
];

export function EmployeeLayoutClient({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const pathname = usePathname();
  const setProfile = useUserStore((s) => s.setProfile);

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    setProfile(profile);
    return () => setProfile(null);
  }, [profile, setProfile]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r bg-sidebar border-sidebar-border min-h-screen">
        <div className="p-6 mb-2">
          <Link href="/employee-dashboard" className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              HRMS.pro
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-4 mt-2">
            Employee Portal
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/employee-dashboard" &&
                pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all group duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-white" : "text-muted-foreground",
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
                {profile.name}
              </span>
              <span className="text-[10px] text-muted-foreground truncate mt-1">
                {profile.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-4 sm:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="bg-primary rounded-lg p-1.5">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-foreground">HRMS.pro</span>
            </div>

            <div className="flex items-center space-x-2 ml-auto">
              <NotificationBell />
              <ModeToggle />
              <div className="h-6 w-px bg-border mx-1" />
              <UserNav />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
