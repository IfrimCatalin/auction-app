import Link from "next/link";
import { GobidMeLogo } from "@/components/gobidme-logo";
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
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted transition hover:text-ink"
          >
            ← Dashboard
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10 lg:px-8 lg:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">List an item</h1>
        <p className="mt-2 text-sm text-muted">
          Share something special with the community. Add a clear photo and an honest description.
        </p>

        <div className="mt-8 rounded-3xl border border-border bg-surface p-6 sm:p-8">
          <CreateListingForm sellerId={user.id} />
        </div>
      </section>
    </main>
  );
}
