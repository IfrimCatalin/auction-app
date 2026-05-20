"use client";

import {
  AUCTION_DURATION_PRESETS,
  type AuctionDurationId,
  type AuctionDurationPreset,
  isDurationSelectable,
} from "@/lib/auction-duration";

type AuctionDurationSelectorProps = {
  value: AuctionDurationId | "";
  onChange: (id: AuctionDurationId) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
};

function tierStyles(preset: AuctionDurationPreset, selected: boolean) {
  if (selected) {
    if (preset.tier === "featured") {
      return "border-accent bg-accent/10 shadow-[0_0_0_1px_rgba(212,175,55,0.35)]";
    }
    if (preset.tier === "premium") {
      return "border-accent/70 bg-accent/5 shadow-[0_0_0_1px_rgba(212,175,55,0.2)]";
    }
    return "border-accent bg-page-dark";
  }

  if (preset.tier === "featured") {
    return "border-border bg-elevated hover:border-accent/40";
  }
  if (preset.tier === "premium") {
    return "border-border bg-surface hover:border-accent/30";
  }
  return "border-border bg-page hover:border-border hover:bg-page-dark";
}

function badgeStyles(preset: AuctionDurationPreset) {
  if (preset.badge === "Featured") {
    return "bg-accent text-black";
  }
  if (preset.badge === "Premium") {
    return "border border-accent/50 bg-accent/15 text-accent";
  }
  return "bg-page-dark text-muted";
}

export function AuctionDurationSelector({
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
}: AuctionDurationSelectorProps) {
  return (
    <fieldset className="space-y-3" onBlur={onBlur}>
      <legend className="mb-2 block text-sm font-medium text-ink/90">
        Auction duration
      </legend>
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "auction-duration-error" : undefined}
      >
        {AUCTION_DURATION_PRESETS.map((preset) => {
          const selected = value === preset.id;
          const selectable = isDurationSelectable(preset);

          return (
            <label
              key={preset.id}
              className={`relative flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
                tierStyles(preset, selected)
              } ${!selectable || disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="radio"
                name="auction-duration"
                value={preset.id}
                checked={selected}
                disabled={disabled || !selectable}
                onChange={() => onChange(preset.id)}
                className="sr-only"
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-ink">{preset.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{preset.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeStyles(preset)}`}
                >
                  {preset.badge ?? "Free"}
                </span>
              </div>
              {preset.requiresPayment ? (
                <p className="mt-3 text-[11px] text-muted/90">
                  Included at no cost during early access.
                </p>
              ) : null}
              {selected ? (
                <span
                  className="absolute right-3 bottom-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-black"
                  aria-hidden
                >
                  ✓
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id="auction-duration-error" className="text-sm text-rose-600" role="alert">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted">
          End time is set automatically from your chosen duration.
        </p>
      )}
    </fieldset>
  );
}
