import type { Metadata } from "next";
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
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-stone-50/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            GoBidMe
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link
              href="/watchlist"
              className="hidden rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 sm:inline-flex"
            >
              Watchlist
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 pb-16 pt-10 lg:px-8 lg:pt-14">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Notifications</h1>
        <p className="mt-2 text-sm text-stone-500">
          Activity about your listings and bids.
        </p>

        {error ? (
          <div className="mt-8 rounded-3xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Could not load notifications: {error.message}
          </div>
        ) : null}

        {!error && notifications.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
            No notifications yet. As activity happens, updates will appear here.
          </div>
        ) : null}

        <div className="mt-8 space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-3xl border bg-white p-5 ${
                notification.read_at
                  ? "border-stone-200"
                  : "border-stone-300 shadow-[0_0_0_1px_rgba(24,24,27,0.04)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-stone-900">
                    {notification.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-stone-700">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-stone-500">
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
                  className="mt-3 inline-block text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
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
