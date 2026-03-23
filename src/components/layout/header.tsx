"use client";

import { UserNav } from "@/components/layout/user-nav";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center gap-4 flex-1">
          <MobileSidebar />
          <div className="hidden md:flex relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search anything..."
              className="pl-10 h-10 w-full bg-secondary/50 border-none rounded-xl focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <NotificationBell />
          <ModeToggle />
          <div className="h-6 w-px bg-border mx-2" />
          <UserNav />
        </div>
      </div>
    </header>
  );
}
