import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { getOrCreateProfile } from "@/lib/profile-server";
import { getProfileDisplayName } from "@/lib/profiles";
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

  if (!user) {
    redirect("/login");
  }

  const profile = await getOrCreateProfile(supabase, user.id);

  if (!profile) {
    return (
      <main className="min-h-screen bg-page px-5 py-16 text-ink">
        <div className="mx-auto max-w-lg rounded-3xl border border-rose-500/30 bg-rose-950/40 p-8 text-center text-sm text-rose-300">
          Could not load your profile. Make sure the profiles table and RLS policies are set up in
          Supabase, then try again.
        </div>
      </main>
    );
  }

  const displayName = getProfileDisplayName(profile, user.email?.split("@")[0] ?? "Your profile");

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/my-listings"
              className="font-medium text-muted transition hover:text-ink"
            >
              My Listings
            </Link>
            <Link
              href="/watchlist"
              className="font-medium text-muted transition hover:text-ink"
            >
              Watchlist
            </Link>
            <Link
              href="/notifications"
              className="font-medium text-muted transition hover:text-ink"
            >
              Notifications
            </Link>
            <Link
              href={`/seller/${user.id}`}
              className="font-medium text-muted transition hover:text-ink"
            >
              Public page
            </Link>
            <Link
              href="/dashboard"
              className="font-medium text-muted transition hover:text-ink"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 lg:px-8 lg:py-14">
        <p className="text-sm font-medium text-muted">Account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
        <p className="mt-2 text-sm text-muted">
          This is how buyers see you on GoBidMe. Signed in as {user.email}
        </p>

        <div className="mt-10 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <ProfileForm userId={user.id} initial={profile} />
        </div>
      </section>
    </main>
  );
}
