import type { Metadata } from "next";
import { ChatPanel } from "@/components/messages/chat-panel";
import { ConversationList } from "@/components/messages/conversation-list";
import { AuthenticatedSection } from "@/components/authenticated-layout";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cardBase } from "@/lib/ui-tokens";
import {
  getConversationForUser,
  getConversationsForUser,
  getMessagesForConversation,
  getTotalUnreadCount,
} from "@/lib/messages";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/server";
import { unstable_noStore as noStore } from "next/cache";

export const metadata: Metadata = {
  title: "Messages",
  description: "Chat with buyers and sellers on GoBidMe.",
};

export const dynamic = "force-dynamic";

type MessagesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  noStore();
  const params = await searchParams;
  const activeConversationId = readParam(params.c).trim() || null;
  const errorMessage = readParam(params.error).trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const conversations = await getConversationsForUser(supabase, user.id);
  const totalUnread = getTotalUnreadCount(conversations);

  const activeConversation = activeConversationId
    ? await getConversationForUser(supabase, activeConversationId, user.id)
    : null;

  const initialMessages =
    activeConversation && activeConversationId
      ? await getMessagesForConversation(supabase, activeConversationId)
      : [];

  const showChatOnMobile = Boolean(activeConversation);

  return (
    <AuthenticatedSection className="flex min-h-0 flex-1 flex-col pb-6 lg:pb-8">
        <PageHeader
          eyebrow="Inbox"
          title="Messages"
          description={
            totalUnread > 0
              ? `${totalUnread} unread message${totalUnread === 1 ? "" : "s"}`
              : "Chat with buyers and sellers about your listings."
          }
        />

        {errorMessage ? (
          <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <div
          className={cn(
            cardBase,
            "flex min-h-[min(70vh,640px)] flex-1 overflow-hidden border-2 border-accent/25 shadow-2xl shadow-accent/10 ring-2 ring-accent/15 lg:min-h-[560px]"
          )}
        >
          <aside
            className={cn(
              "flex w-full flex-col border-border lg:w-[min(100%,360px)] lg:shrink-0 lg:border-r",
              showChatOnMobile ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-ink">Conversations</p>
            </div>
            <ConversationList
              conversations={conversations}
              activeId={activeConversationId}
            />
          </aside>

          <div
            className={cn(
              "flex min-h-0 min-w-0 flex-1 flex-col",
              showChatOnMobile ? "flex" : "hidden lg:flex"
            )}
          >
            {activeConversation ? (
              <ChatPanel
                conversation={activeConversation}
                initialMessages={initialMessages}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-6">
                <EmptyState
                  title="Select a conversation"
                  description="Choose a thread from the list or start one from a listing or order."
                  actionLabel="Browse auctions"
                  actionHref="/auctions"
                />
              </div>
            )}
          </div>
        </div>
    </AuthenticatedSection>
  );
}
