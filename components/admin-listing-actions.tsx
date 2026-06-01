"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  adminCancelListingAction,
  adminSetListingHiddenAction,
} from "@/app/admin/actions";

type AdminListingActionsProps = {
  listingId: string;
  status: string;
  isHidden: boolean;
};

export function AdminListingActions({
  listingId,
  status,
  isHidden,
}: AdminListingActionsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const isCancelled = status === "cancelled";

  function runAction(action: () => Promise<{ ok: boolean; error?: string }>) {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setMessage(result.error ?? "Action failed.");
        return;
      }
      setMessage("Saved.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending || isCancelled}
        onClick={() => runAction(() => adminCancelListingAction(listingId))}
        className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          runAction(() => adminSetListingHiddenAction(listingId, !isHidden))
        }
        className="rounded-full border border-border bg-page-dark px-3 py-1.5 text-xs font-medium text-ink transition hover:border-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isHidden ? "Unhide" : "Hide"}
      </button>
      {message ? <span className="text-xs text-muted">{message}</span> : null}
    </div>
  );
}
