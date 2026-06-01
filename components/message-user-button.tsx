"use client";

import { useFormStatus } from "react-dom";
import { openConversationFormAction } from "@/app/(authenticated)/messages/actions";
import { btnSecondary } from "@/lib/ui-theme";

type MessageUserButtonProps = {
  listingId: string;
  buyerId?: string;
  label: string;
  className?: string;
  compact?: boolean;
};

function SubmitLabel({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <>{pending ? "Opening…" : label}</>;
}

export function MessageUserButton({
  listingId,
  buyerId,
  label,
  className = "",
  compact = false,
}: MessageUserButtonProps) {
  const baseClass = compact
    ? "inline-flex rounded-full border border-border bg-page px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent/40 disabled:opacity-50"
    : btnSecondary;

  return (
    <form action={openConversationFormAction} className={className}>
      <input type="hidden" name="listingId" value={listingId} />
      {buyerId ? <input type="hidden" name="buyerId" value={buyerId} /> : null}
      <button
        type="submit"
        className={`${baseClass} ${compact ? "" : "w-full sm:w-auto"}`.trim()}
      >
        <SubmitLabel label={label} />
      </button>
    </form>
  );
}
