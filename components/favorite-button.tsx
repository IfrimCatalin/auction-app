"use client";

import { useRouter, usePathname } from "next/navigation";
import { type MouseEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FavoriteButtonProps = {
  listingId: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
  userId?: string;
  isOwner?: boolean;
  variant?: "card" | "detail";
  className?: string;
};

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function FavoriteButton({
  listingId,
  initialFavorited,
  isAuthenticated,
  userId,
  isOwner = false,
  variant = "card",
  className = "",
}: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    if (isOwner) return;
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated || !userId) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.push(`/login${next}`);
      return;
    }

    setLoading(true);

    try {
      if (favorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("listing_id", listingId);

        if (error) throw error;
        setFavorited(false);
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: userId, listing_id: listingId });

        if (error) throw error;
        setFavorited(true);
      }

      router.refresh();
    } catch {
      setFavorited(initialFavorited);
    } finally {
      setLoading(false);
    }
  };

  const label = favorited ? "Remove from watchlist" : "Add to watchlist";

  if (isOwner) {
    return null;
  }

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        aria-label={label}
        aria-pressed={favorited}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-60 ${
          favorited
            ? "border-rose-500/30 bg-rose-950/40 text-rose-300 hover:bg-rose-950/60"
            : "border-border bg-surface text-ink/90 hover:bg-page-dark"
        } ${className}`}
      >
        <HeartIcon filled={favorited} />
        <span>{favorited ? "Saved" : "Save"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={label}
      aria-pressed={favorited}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface/95 text-muted shadow-sm backdrop-blur transition hover:bg-surface hover:text-accent disabled:opacity-60 ${
        favorited ? "text-accent" : ""
      } ${className}`}
    >
      <HeartIcon filled={favorited} />
    </button>
  );
}
