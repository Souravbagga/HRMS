"use client";

import { useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import type { Profile } from "@/types";

export function DashboardLayoutClient({
  children,
  profile,
}: {
  children: React.ReactNode;
  profile: Profile;
}) {
  const setProfile = useUserStore((s) => s.setProfile);

  useEffect(() => {
    setProfile(profile);
    return () => setProfile(null);
  }, [profile, setProfile]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="hidden lg:flex" />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
