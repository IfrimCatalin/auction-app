import type { Metadata } from "next";
import Link from "next/link";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { ChatPanel } from "@/components/messages/chat-panel";
import { ConversationList } from "@/components/messages/conversation-list";
import { LogoutButton } from "@/components/logout-button";
import {
  getConversationForUser,
  getConversationsForUser,
  getMessagesForConversation,
  getTotalUnreadCount,
} from "@/lib/messages";
import { btnSecondary, headingPage, pageShell, sectionMuted } from "@/lib/ui-theme";
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
    <main className={`${pageShell} flex min-h-screen flex-col`}>
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/80 bg-page/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <GobidMeLogo />
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className={btnSecondary}>
              Dashboard
            </Link>
            <LogoutButton />
          </div>
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 py-6 lg:px-8 lg:py-8">
        <div className="mb-4 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Inbox</p>
          <h1 className={`${headingPage} mt-1 text-2xl sm:text-3xl`}>Messages</h1>
          <p className={`${sectionMuted} mt-1`}>
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread === 1 ? "" : "s"}`
              : "Chat with buyers and sellers about your listings."}
          </p>
        </div>

        {errorMessage ? (
          <p className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-border bg-surface shadow-lg shadow-black/40">
          <aside
            className={`flex w-full flex-col border-border lg:w-[320px] lg:shrink-0 lg:border-r xl:w-[360px] ${
              showChatOnMobile ? "hidden lg:flex" : "flex"
            }`}
          >
            <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold text-ink">Conversations</p>
            </div>
            <ConversationList
              conversations={conversations}
              activeId={activeConversation?.id ?? null}
            />
          </aside>

          <div
            className={`min-h-[min(70vh,520px)] flex-1 flex-col lg:min-h-[560px] ${
              showChatOnMobile ? "flex" : "hidden lg:flex"
            }`}
          >
            {activeConversation ? (
              <ChatPanel
                conversation={activeConversation}
                initialMessages={initialMessages}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <p className="text-sm font-medium text-ink">Select a conversation</p>
                <p className={`${sectionMuted} mt-2 max-w-sm`}>
                  Choose a thread from the list, or start one from a listing or order.
                </p>
                <Link href="/auctions" className={`${btnSecondary} mt-6`}>
                  Browse auctions
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
