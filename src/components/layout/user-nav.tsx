"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/userStore";
import { createClient } from "@/lib/supabaseClient";
import { LogOut, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function UserNav() {
  const router = useRouter();
  const profile = useUserStore((s) => s.profile);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  const settingsHref =
    profile?.role === "admin" ? "/settings" : "/employee-dashboard/settings";

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        className="relative h-9 w-9 rounded-full"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="h-9 w-9 p-4 rounded-full bg-muted border border-border/40 flex items-center justify-center text-xs font-bold text-foreground">
          {initials}
        </div>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border/60 bg-popover p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User info header */}
          <div className="px-3 py-2.5 border-b border-border/40 mb-1">
            <p className="text-sm font-bold leading-none">
              {profile?.name ?? "Loading..."}
            </p>
            <p className="text-xs leading-none text-muted-foreground mt-1">
              {profile?.email ?? ""}
            </p>
            {profile?.role && (
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mt-1 block">
                {profile.role}
              </span>
            )}
          </div>

          <button
            onClick={() => {
              setOpen(false);
              router.push(settingsHref);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>

          <div className="h-px bg-border/40 my-1" />

          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
