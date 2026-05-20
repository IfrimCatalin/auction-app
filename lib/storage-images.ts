import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "listing-images";

/** Extract object path from a Supabase public storage URL. */
export function publicUrlToStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(publicUrl.slice(index + marker.length));
}

/** Best-effort removal; failures are ignored so DB delete can still succeed. */
export async function removeStorageImagesByUrls(
  supabase: SupabaseClient,
  imageUrls: string[]
) {
  const paths = imageUrls
    .map(publicUrlToStoragePath)
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) return;

  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}
