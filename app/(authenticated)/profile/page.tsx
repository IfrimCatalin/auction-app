import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { ProfileForm } from "@/components/profile-form";
import { getOrCreateProfile } from "@/lib/profile-server";
import { getProfileDisplayName } from "@/lib/profiles";
import { errorBox } from "@/lib/ui-tokens";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your profile",
  description: "Edit your GoBidMe seller profile — username, bio, location, and avatar.",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const profile = await getOrCreateProfile(supabase, user.id);

  if (!profile) {
    return (
      <AuthenticatedSection>
        <div className={errorBox}>
          Could not load your profile. Make sure the profiles table and RLS policies are set up in
          Supabase, then try again.
        </div>
      </AuthenticatedSection>
    );
  }

  const displayName = getProfileDisplayName(profile, user.email?.split("@")[0] ?? "Your profile");

  return (
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Account"
        title={displayName}
        description={`How buyers see you on GoBidMe. Signed in as ${user.email}`}
        actions={
          <ButtonLink href={`/seller/${user.id}`} variant="secondary" size="sm">
            Public page →
          </ButtonLink>
        }
      />

      <Card padding="lg" hover={false} className="mt-8 max-w-3xl">
        <ProfileForm userId={user.id} initial={profile} />
      </Card>

      <p className="mt-6 text-sm text-muted">
        <Link href="/dashboard" className="font-medium text-accent hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </AuthenticatedSection>
  );
}
