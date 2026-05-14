import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "A marketplace for rare and beautiful things",
  description:
    "GoBidMe brings collectors and sellers together—discover live auctions, place bids, and manage listings in one elegant marketplace.",
};

type FeaturedListing = {
  id: string;
  title: string;
  category: string;
  current_price: number;
  image_url: string | null;
};

const categories = [
  { name: "Watches", emoji: "⌚" },
  { name: "Art", emoji: "🖼️" },
  { name: "Cars", emoji: "🚗" },
  { name: "Sneakers", emoji: "👟" },
  { name: "Tech", emoji: "📱" },
  { name: "Memorabilia", emoji: "🏆" },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  const { data: listingsData } = await supabase
    .from("listings")
    .select("id, title, category, current_price, image_url")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(6);

  const featured = (listingsData ?? []) as FeaturedListing[];

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            GoBidMe
          </Link>
          <ul className="hidden items-center gap-7 text-sm text-stone-600 md:flex">
            <li>
              <Link href="/auctions" className="transition hover:text-stone-900">
                Auctions
              </Link>
            </li>
            <li>
              <Link href="/auctions" className="transition hover:text-stone-900">
                Categories
              </Link>
            </li>
            <li>
              <Link href="/create-listing" className="transition hover:text-stone-900">
                Sell
              </Link>
            </li>
          </ul>
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            {isAuthenticated ? "Dashboard" : "Sign in"}
          </Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-16 pt-12 md:pt-20 lg:px-8 lg:pt-24">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-stone-500">A community for collectors</p>
          <h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-tight text-stone-900 sm:text-5xl md:text-6xl lg:text-7xl">
            Rare finds.
            <br />
            <span className="text-stone-500">Honest bids.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-stone-600 sm:text-lg">
            GoBidMe is the calm, image-first marketplace for trusted sellers and serious buyers.
            Discover beautiful objects and place a bid in seconds.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={isAuthenticated ? "/auctions" : "/signup"}
              className="rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Start bidding
            </Link>
            <Link
              href="/auctions"
              className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
            >
              Browse auctions
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Featured listings</h2>
            <p className="mt-1 text-sm text-stone-500">Fresh items from sellers this week.</p>
          </div>
          <Link
            href="/auctions"
            className="hidden text-sm font-medium text-stone-900 underline-offset-4 hover:underline sm:inline"
          >
            See all
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
            No live listings yet. Be the first to{" "}
            <Link href="/create-listing" className="font-medium text-stone-900 underline">
              create one
            </Link>
            .
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <Link
                key={item.id}
                href={`/auctions/${item.id}`}
                className="group overflow-hidden rounded-3xl border border-stone-200 bg-white transition hover:shadow-md"
              >
                <div className="aspect-square w-full overflow-hidden bg-stone-100">
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-500">{item.category}</p>
                  <h3 className="mt-1 line-clamp-1 text-base font-medium text-stone-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-lg font-semibold text-stone-900">
                    {formatPrice(item.current_price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Browse by category</h2>
        <p className="mt-1 text-sm text-stone-500">Curated by the GoBidMe community.</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href="/auctions"
              className="flex flex-col items-start gap-2 rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-stone-300 hover:shadow-sm"
            >
              <span className="text-2xl" aria-hidden>
                {category.emoji}
              </span>
              <span className="text-sm font-medium text-stone-900">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-8 text-sm text-stone-500 sm:flex-row sm:items-center lg:px-8">
          <p>© {new Date().getFullYear()} GoBidMe</p>
          <div className="flex items-center gap-5">
            <a href="#" className="transition hover:text-stone-900">
              Terms
            </a>
            <a href="#" className="transition hover:text-stone-900">
              Privacy
            </a>
            <a href="#" className="transition hover:text-stone-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
