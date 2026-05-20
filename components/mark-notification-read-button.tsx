"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MarkNotificationReadButtonProps = {
  notificationId: string;
  userId: string;
  isRead: boolean;
};

export function MarkNotificationReadButton({
  notificationId,
  userId,
  isRead,
}: MarkNotificationReadButtonProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isRead) {
    return (
      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
        Read
      </span>
    );
  }

  const onMarkRead = async () => {
    setLoading(true);
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("user_id", userId)
      .is("read_at", null);
    setLoading(false);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onMarkRead}
      disabled={loading}
      className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Marking..." : "Mark as read"}
    </button>
  );
}
