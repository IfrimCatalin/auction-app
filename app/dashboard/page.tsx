import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">BidMe</p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">Signed in as {user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/create-listing"
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Create Listing
            </Link>
            <LogoutButton />
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Active Bids</p>
            <p className="mt-3 text-3xl font-semibold text-white">12</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-sm text-slate-400">Watchlist</p>
            <p className="mt-3 text-3xl font-semibold text-white">28</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:col-span-2 lg:col-span-1">
            <p className="text-sm text-slate-400">Won Auctions</p>
            <p className="mt-3 text-3xl font-semibold text-white">3</p>
          </article>
        </section>
      </div>
    </main>
  );
}
