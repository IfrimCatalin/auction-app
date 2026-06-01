import type { SupabaseClient } from "@supabase/supabase-js";

export async function isUserAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[isUserAdmin]", error.message);
    return false;
  }

  return Boolean(data?.user_id);
}
