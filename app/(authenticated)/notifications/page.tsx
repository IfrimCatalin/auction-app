import type { Metadata } from "next";
import Link from "next/link";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { MarkNotificationReadButton } from "@/components/mark-notification-read-button";
import { Card } from "@/components/ui/card";
import { type NotificationRow } from "@/lib/notifications";
import { errorBox } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";
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

  if (!user) return null;

  const { data, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, message, listing_id, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notifications = (data ?? []) as NotificationRow[];

  return (
    <AuthenticatedSection>
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Updates about your listings, bids, and orders."
      />

      {error ? (
        <p className={`${errorBox} mt-8`}>Could not load notifications: {error.message}</p>
      ) : null}

      {!error && notifications.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="No notifications yet"
          description="When there's activity on your account, updates will appear here."
          actionLabel="Browse auctions"
          actionHref="/auctions"
        />
      ) : (
        <ul className="mt-10 space-y-4">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Card
                padding="md"
                hover={false}
                className={cn(
                  !notification.read_at && "border-accent/30 ring-1 ring-accent/20"
                )}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-ink">{notification.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {notification.message}
                    </p>
                    <p className="mt-2 text-xs text-muted/80">
                      {formatDate(notification.created_at)}
                    </p>
                    {notification.listing_id ? (
                      <Link
                        href={`/auctions/${notification.listing_id}`}
                        className="mt-3 inline-block text-sm font-semibold text-accent hover:underline"
                      >
                        View listing →
                      </Link>
                    ) : null}
                  </div>
                  <MarkNotificationReadButton
                    notificationId={notification.id}
                    userId={user.id}
                    isRead={Boolean(notification.read_at)}
                  />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </AuthenticatedSection>
  );
}
