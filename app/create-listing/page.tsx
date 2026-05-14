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
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            GoBidMe
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-stone-600 transition hover:text-stone-900"
          >
            ← Dashboard
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-2xl px-5 py-10 lg:px-8 lg:py-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">List an item</h1>
        <p className="mt-2 text-sm text-stone-500">
          Share something special with the community. Add a clear photo and an honest description.
        </p>

        <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
          <CreateListingForm sellerId={user.id} />
        </div>
      </section>
    </main>
  );
}
