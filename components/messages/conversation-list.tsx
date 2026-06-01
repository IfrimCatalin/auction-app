import Link from "next/link";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { ConversationListItem } from "@/lib/messages";
import { formatMessageTime } from "@/lib/messages";

type ConversationListProps = {
  conversations: ConversationListItem[];
  activeId: string | null;
};

export function ConversationList({ conversations, activeId }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <p className="text-sm font-medium text-ink">No conversations yet</p>
        <p className="mt-2 max-w-xs text-sm text-muted">
          Message a seller from a listing or a buyer from a sold order to start chatting.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-y-auto">
      {conversations.map((conversation) => {
        const isActive = conversation.id === activeId;
        const preview = conversation.lastMessagePreview ?? "No messages yet";
        const timeLabel = conversation.lastMessageAt
          ? formatMessageTime(conversation.lastMessageAt)
          : "";

        return (
          <li key={conversation.id}>
            <Link
              href={`/messages?c=${conversation.id}`}
              className={`flex gap-3 px-4 py-3.5 transition sm:px-5 ${
                isActive
                  ? "bg-accent/10 border-l-2 border-l-accent"
                  : "hover:bg-page-dark/80 border-l-2 border-l-transparent"
              }`}
            >
              <ProfileAvatar
                profile={{
                  username: null,
                  full_name: conversation.otherUserName,
                  avatar_url: conversation.otherUserAvatarUrl,
                }}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink">
                    {conversation.otherUserName}
                  </p>
                  {timeLabel ? (
                    <span className="shrink-0 text-[11px] text-muted">{timeLabel}</span>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted">{conversation.listingTitle}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p
                    className={`truncate text-xs ${
                      conversation.unreadCount > 0 ? "font-medium text-ink" : "text-muted"
                    }`}
                  >
                    {preview}
                  </p>
                  {conversation.unreadCount > 0 ? (
                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-black">
                      {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
