import type { Metadata } from "next";
import { GobidMeLogo } from "@/components/gobidme-logo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { MarkNotificationReadButton } from "@/components/mark-notification-read-button";
import { type NotificationRow } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Your recent GoBidMe activity and alerts.",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, message, listing_id, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notifications = (data ?? []) as NotificationRow[];

  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
            <Link
              href="/orders"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Orders
            </Link>
            <Link
              href="/my-listings"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              My Listings
            </Link>
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              href="/watchlist"
              className="hidden rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark sm:inline-flex"
            >
              Watchlist
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notifications</h1>
        <p className="mt-2 text-sm text-muted">
          Activity about your listings and bids.
        </p>

        {error ? (
          <div className="mt-8 rounded-3xl border border-rose-500/30 bg-rose-950/40 px-5 py-4 text-sm text-rose-300">
            Could not load notifications: {error.message}
          </div>
        ) : null}

        {!error && notifications.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-border bg-surface p-10 text-center text-sm text-muted">
            No notifications yet. As activity happens, updates will appear here.
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-3xl border bg-surface p-5 ${
                notification.read_at
                  ? "border-border"
                  : "border-border shadow-[0_0_0_1px_rgba(212,175,55,0.08)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-ink">
                    {notification.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink/90">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDate(notification.created_at)}
                  </p>
                </div>
                <MarkNotificationReadButton
                  notificationId={notification.id}
                  userId={user.id}
                  isRead={Boolean(notification.read_at)}
                />
              </div>
              {notification.listing_id ? (
                <Link
                  href={`/auctions/${notification.listing_id}`}
                  className="mt-3 inline-block text-sm font-medium text-ink underline-offset-4 hover:underline"
                >
                  View listing
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
