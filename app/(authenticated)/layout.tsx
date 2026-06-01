import { redirect } from "next/navigation";
import { AuthenticatedLayout } from "@/components/authenticated-layout";
import { isUserAdmin } from "@/lib/admin";
import { getConversationsForUser, getTotalUnreadCount } from "@/lib/messages";
import { getUnreadNotificationCount } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";

export default async function AuthenticatedRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [conversations, unreadNotifications, isAdmin] = await Promise.all([
    getConversationsForUser(supabase, user.id),
    getUnreadNotificationCount(supabase, user.id),
    isUserAdmin(supabase, user.id),
  ]);

  const unreadMessages = getTotalUnreadCount(conversations);

  return (
    <AuthenticatedLayout
      unreadMessages={unreadMessages}
      unreadNotifications={unreadNotifications}
      showAdmin={isAdmin}
    >
      {children}
    </AuthenticatedLayout>
  );
}
