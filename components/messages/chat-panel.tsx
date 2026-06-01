"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { markConversationReadAction } from "@/app/(authenticated)/messages/actions";
import { MessageComposer } from "@/components/messages/message-composer";
import { ProfileAvatar } from "@/components/profile-avatar";
import { useConversationMessages } from "@/hooks/use-conversation-messages";
import type { ConversationListItem, MessageRow } from "@/lib/messages";
import { formatMessageTime } from "@/lib/messages";

type ChatPanelProps = {
  conversation: ConversationListItem;
  initialMessages: MessageRow[];
  currentUserId: string;
};

export function ChatPanel({
  conversation,
  initialMessages,
  currentUserId,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const markRead = useCallback(() => {
    void markConversationReadAction(conversation.id);
  }, [conversation.id]);

  const { messages, appendMessage } = useConversationMessages(
    conversation.id,
    initialMessages,
    currentUserId,
    markRead
  );

  useEffect(() => {
    markRead();
  }, [conversation.id, markRead]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, conversation.id]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:px-5">
        <Link
          href="/messages"
          className="mr-1 text-sm text-muted hover:text-ink lg:hidden"
          aria-label="Back to conversations"
        >
          ←
        </Link>
        <ProfileAvatar
          profile={{
            username: null,
            full_name: conversation.otherUserName,
            avatar_url: conversation.otherUserAvatarUrl,
          }}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{conversation.otherUserName}</p>
          <Link
            href={`/auctions/${conversation.listingId}`}
            className="truncate text-xs text-muted hover:text-accent"
          >
            {conversation.listingTitle}
          </Link>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-page/50 px-4 py-4 sm:px-5"
      >
        {messages.length === 0 ? (
          <p className="m-auto max-w-xs text-center text-sm text-muted">
            Send a message to start the conversation about this listing.
          </p>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            return (
              <div
                key={message.id}
                className={`flex motion-safe:transition-opacity ${isOwn ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[min(85%,20rem)] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[70%] ${
                    isOwn
                      ? "rounded-br-sm bg-accent text-black shadow-accent/10"
                      : "rounded-bl-sm border border-border bg-surface text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-[10px] ${
                      isOwn ? "text-black/60" : "text-muted"
                    }`}
                  >
                    {formatMessageTime(message.created_at)}
                    {isOwn && message.read_at ? " · Read" : null}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <MessageComposer
        conversationId={conversation.id}
        onMessageSent={appendMessage}
      />
    </div>
  );
}
