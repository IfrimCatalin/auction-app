"use client";

import { FormEvent, useState, useTransition } from "react";
import { sendMessageAction } from "@/app/(authenticated)/messages/actions";
import type { MessageRow } from "@/lib/messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { errorBox } from "@/lib/ui-tokens";

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
      className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-surface/95 p-3 backdrop-blur sm:p-4"
    >
      {error ? (
        <p className={`${errorBox} mb-2 py-2 text-xs`} role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={1}
          maxLength={4000}
          disabled={pending}
          placeholder="Write a message…"
          className="max-h-32 min-h-[44px] flex-1 resize-none py-2.5"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <Button
          type="submit"
          disabled={pending || !content.trim()}
          loading={pending}
          className="shrink-0 self-end"
          aria-label="Send message"
        >
          Send
        </Button>
      </div>
    </form>
  );
}
