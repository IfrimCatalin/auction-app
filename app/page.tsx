import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const featuredAuctions = [
  {
    title: "Rolex Submariner 2024",
    currentBid: "$12,800",
    timeLeft: "2h 14m",
    category: "Luxury Watches",
  },
  {
    title: "Porsche 911 GT3 Model",
    currentBid: "$3,200",
    timeLeft: "6h 48m",
    category: "Collectibles",
  },
  {
    title: "Contemporary Art Piece",
    currentBid: "$9,750",
    timeLeft: "1d 3h",
    category: "Art",
  },
];

const categories = [
  "Watches",
  "Art",
  "Cars",
  "Sneakers",
  "Tech",
  "Memorabilia",
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />
          <div className="absolute right-0 top-44 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        </div>

        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
              <span className="text-lg font-semibold tracking-tight">BidMe</span>
            </div>
            <ul className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <li>
                <Link href="/auctions" className="hover:text-white">
                  Auctions
                </Link>
              </li>
              <li>Categories</li>
              <li>How it Works</li>
              <li>Sellers</li>
            </ul>
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/30 hover:bg-white/5"
            >
              {isAuthenticated ? "Dashboard" : "Sign In"}
            </Link>
          </nav>
        </header>

        <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 lg:px-8 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Premium Marketplace
              </p>
              <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Discover rare items and bid with confidence.
              </h1>
              <p className="mt-6 max-w-xl text-base text-slate-300 sm:text-lg">
                BidMe connects serious buyers with trusted sellers in a sleek, secure auction
                experience designed for high-value products.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href={isAuthenticated ? "/auctions" : "/signup"}
                  className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Start Bidding
                </Link>
                <Link
                  href="/auctions"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
                >
                  Explore Auctions
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-300">Live Highlight</p>
                <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-medium text-emerald-300">
                  Live
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">Audemars Piguet Royal Oak</h2>
              <p className="mt-2 text-sm text-slate-300">Current bid</p>
              <p className="mt-1 text-4xl font-bold text-cyan-300">$48,500</p>
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Time Left</p>
                  <p className="mt-1 font-semibold">00:38:14</p>
                </div>
                <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">Featured Auctions</h3>
          <Link href="/dashboard" className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            View all
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredAuctions.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/30"
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.category}</p>
              <h4 className="mt-3 text-lg font-semibold text-white">{item.title}</h4>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-400">Current bid</p>
                  <p className="mt-1 text-2xl font-bold text-cyan-300">{item.currentBid}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Ends in</p>
                  <p className="mt-1 font-medium text-slate-200">{item.timeLeft}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8">
          <h3 className="text-2xl font-semibold text-white sm:text-3xl">Browse by Category</h3>
          <p className="mt-3 max-w-2xl text-slate-300">
            Jump into curated categories and discover listings from verified sellers.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <button
                key={category}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-5 py-4 text-left font-medium text-slate-100 transition hover:border-cyan-300/40 hover:bg-slate-950"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 text-sm text-slate-400 sm:flex-row sm:items-center lg:px-8">
          <p>© {new Date().getFullYear()} BidMe. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-slate-200">
              Terms
            </a>
            <a href="#" className="hover:text-slate-200">
              Privacy
            </a>
            <a href="#" className="hover:text-slate-200">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}