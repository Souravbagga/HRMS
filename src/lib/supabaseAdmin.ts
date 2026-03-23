import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client using the service role key.
 * NEVER import this in client components — server-side only.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
