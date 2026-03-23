import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

/**
 * Handles ALL Supabase auth callbacks:
 *  - Invite links  → token_hash + type=invite  → set-password page
 *  - Password reset → token_hash + type=recovery → set-password page
 *  - Email confirm → code (PKCE)               → dashboard
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/employee-dashboard";

  const supabase = await createClient();

  // ── Invite / password-reset flow (token_hash) ──────────────────────────
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "invite" | "recovery" | "signup" | "email",
    });

    if (!error) {
      // After invite verification, send employee to set-password page
      return NextResponse.redirect(`${origin}/auth/set-password`);
    }

    console.error("[auth/confirm] verifyOtp error:", error.message);
    return NextResponse.redirect(`${origin}/login?error=invite_expired`);
  }

  // ── PKCE code exchange (OAuth / email confirmation) ────────────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        return NextResponse.redirect(
          `${origin}${profile?.role === "admin" ? "/dashboard" : next}`
        );
      }
    }

    console.error("[auth/confirm] exchangeCodeForSession error:", error?.message);
    return NextResponse.redirect(`${origin}/login?error=invite_expired`);
  }

  return NextResponse.redirect(`${origin}/login?error=invite_expired`);
}
