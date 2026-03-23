import { createClient } from "@/lib/supabaseClient";
import type { NotificationType } from "@/types";

/**
 * Insert a notification for a specific user.
 * Call this client-side after an action (clock-in, leave apply, etc.)
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}) {
  const supabase = createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    read: false,
  });
}

/**
 * Notify all admins about an event (e.g. employee clocked in, leave applied).
 */
export async function notifyAdmins({
  title,
  message,
  type,
}: {
  title: string;
  message: string;
  type: NotificationType;
}) {
  const supabase = createClient();
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");

  if (!admins || admins.length === 0) return;

  const rows = admins.map((admin) => ({
    user_id: admin.id,
    title,
    message,
    type,
    read: false,
  }));

  await supabase.from("notifications").insert(rows);
}
