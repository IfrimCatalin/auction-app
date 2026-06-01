"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MessageRow } from "@/lib/messages";

type RealtimeMessageRow = MessageRow;

export function useConversationMessages(
  conversationId: string,
  initialMessages: MessageRow[],
  currentUserId: string,
  onIncomingMessage?: () => void
) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as RealtimeMessageRow;
          setMessages((prev) => {
            if (prev.some((message) => message.id === row.id)) {
              return prev;
            }
            return [...prev, row];
          });

          if (row.sender_id !== currentUserId) {
            onIncomingMessage?.();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, onIncomingMessage, supabase]);

  function appendMessage(message: MessageRow) {
    setMessages((prev) => {
      if (prev.some((row) => row.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  }

  return { messages, appendMessage };
}
