import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import { EmployeeLayoutClient } from "@/components/layout/employee-layout-client";
import type { Profile } from "@/types";

export default async function EmployeeDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <EmployeeLayoutClient profile={profile as Profile}>
      {children}
    </EmployeeLayoutClient>
  );
}
