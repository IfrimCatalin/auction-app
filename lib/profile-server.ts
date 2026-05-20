import type { SupabaseClient } from "@supabase/supabase-js";
import { PROFILE_SELECT, type Profile } from "@/lib/profiles";

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", userId)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}

export async function getOrCreateProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<Profile | null> {
  const existing = await getProfileById(supabase, userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId })
    .select(PROFILE_SELECT)
    .single();

  if (error) return null;
  return data as Profile;
}
