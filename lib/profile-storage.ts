import type { SupabaseClient } from "@supabase/supabase-js";
import { AVATAR_STORAGE_BUCKET } from "@/lib/profiles";

export function avatarPublicUrlToStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${AVATAR_STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

export async function removeAvatarByUrl(supabase: SupabaseClient, avatarUrl: string | null) {
  if (!avatarUrl) return;
  const path = avatarPublicUrlToStoragePath(avatarUrl);
  if (!path) return;
  await supabase.storage.from(AVATAR_STORAGE_BUCKET).remove([path]);
}
