import type { Metadata } from "next";
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
      <main className="min-h-screen bg-stone-50 px-5 py-16 text-stone-900">
        <div className="mx-auto max-w-lg rounded-3xl border border-rose-100 bg-rose-50 p-8 text-center text-sm text-rose-700">
          Could not load your profile. Make sure the profiles table and RLS policies are set up in
          Supabase, then try again.
        </div>
      </main>
    );
  }

  const displayName = getProfileDisplayName(profile, user.email?.split("@")[0] ?? "Your profile");

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            GoBidMe
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/watchlist"
              className="font-medium text-stone-600 transition hover:text-stone-900"
            >
              Watchlist
            </Link>
            <Link
              href="/notifications"
              className="font-medium text-stone-600 transition hover:text-stone-900"
            >
              Notifications
            </Link>
            <Link
              href={`/seller/${user.id}`}
              className="font-medium text-stone-600 transition hover:text-stone-900"
            >
              Public page
            </Link>
            <Link
              href="/dashboard"
              className="font-medium text-stone-600 transition hover:text-stone-900"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-10 lg:px-8 lg:py-14">
        <p className="text-sm font-medium text-stone-500">Account</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{displayName}</h1>
        <p className="mt-2 text-sm text-stone-500">
          This is how buyers see you on GoBidMe. Signed in as {user.email}
        </p>

        <div className="mt-10 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
          <ProfileForm userId={user.id} initial={profile} />
        </div>
      </section>
    </main>
  );
}
