import { PublicPageShell } from "@/components/public-page-shell";
import { createClient } from "@/lib/supabase/server";

export default async function TrustLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <PublicPageShell isAuthenticated={Boolean(user)}>{children}</PublicPageShell>;
}
