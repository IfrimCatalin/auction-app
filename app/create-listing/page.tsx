import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateListingForm } from "@/components/create-listing-form";
import { createClient } from "@/lib/supabase/server";

export default async function CreateListingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100 lg:px-8">
      <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">GoBidMe</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Create Listing</h1>
            <p className="mt-2 text-sm text-slate-300">
              Add your item details and launch a new auction.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/40 hover:bg-white/5"
          >
            Back
          </Link>
        </div>

        <CreateListingForm sellerId={user.id} />
      </div>
    </main>
  );
}
