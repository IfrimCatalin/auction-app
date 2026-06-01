"use client";

import { FormEvent, useState, useTransition } from "react";
import { sendMessageAction } from "@/app/messages/actions";
import type { MessageRow } from "@/lib/messages";
import { btnPrimary, inputBase } from "@/lib/ui-theme";

type MessageComposerProps = {
  conversationId: string;
  onMessageSent?: (message: MessageRow) => void;
};

export function MessageComposer({ conversationId, onMessageSent }: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (!trimmed) return;

    startTransition(async () => {
      const result = await sendMessageAction(conversationId, trimmed);
      if (!result.ok) {
        setError(result.error ?? "Failed to send.");
        return;
      }
      if (result.message) {
        onMessageSent?.(result.message as MessageRow);
      }
      setContent("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-border bg-surface p-3 sm:p-4"
    >
      {error ? (
        <p className="mb-2 text-xs text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={1}
          maxLength={4000}
          disabled={pending}
          placeholder="Write a message…"
          className={`${inputBase} max-h-32 min-h-[44px] flex-1 resize-y py-2.5`}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={pending || !content.trim()}
          className={`${btnPrimary} shrink-0 self-end px-4`}
        >
          {pending ? "…" : "Send"}
        </button>
      </div>
    </form>
  );
}
