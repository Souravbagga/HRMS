import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  // Guard: service role key must be set
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === "your_sb_secret_key_here") {
    console.error("[invite] SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
    return NextResponse.json(
      { error: "Server not configured: missing service role key" },
      { status: 500 }
    );
  }

  // Verify caller is an authenticated admin
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { email, name } = body;

  if (!email || !name) {
    return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Must be a clean URL — Supabase appends token_hash & type as query params
  const redirectTo = `${siteUrl}/auth/confirm`;

  console.log("[invite] Sending invite to:", email, "redirectTo:", redirectTo);

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name, role: "employee" },
    redirectTo,
  });

  if (error) {
    console.error("[invite] Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.log("[invite] Invite sent successfully to:", data.user?.email);
  return NextResponse.json({ success: true });
}
