export type AuctionDurationTier = "free" | "premium" | "featured";

export type AuctionDurationId = "24h" | "3d" | "7d" | "14d";

export type AuctionDurationPreset = {
  id: AuctionDurationId;
  label: string;
  description: string;
  hours: number;
  tier: AuctionDurationTier;
  badge?: "Premium" | "Featured";
  /** Reserved for Stripe — premium tiers will require payment when enabled */
  requiresPayment: boolean;
};

export const AUCTION_DURATION_PRESETS: readonly AuctionDurationPreset[] = [
  {
    id: "24h",
    label: "24 hours",
    description: "Quick flash auction",
    hours: 24,
    tier: "free",
    requiresPayment: false,
  },
  {
    id: "3d",
    label: "3 days",
    description: "Standard listing window",
    hours: 72,
    tier: "free",
    requiresPayment: false,
  },
  {
    id: "7d",
    label: "7 days",
    description: "Extended visibility",
    hours: 24 * 7,
    tier: "premium",
    badge: "Premium",
    requiresPayment: true,
  },
  {
    id: "14d",
    label: "14 days",
    description: "Maximum exposure",
    hours: 24 * 14,
    tier: "featured",
    badge: "Featured",
    requiresPayment: true,
  },
] as const;

export const DEFAULT_AUCTION_DURATION_ID: AuctionDurationId = "3d";

const presetById = new Map(
  AUCTION_DURATION_PRESETS.map((preset) => [preset.id, preset])
);

export function getAuctionDurationPreset(id: string): AuctionDurationPreset | undefined {
  return presetById.get(id as AuctionDurationId);
}

/**
 * Whether a duration can be selected at publish time.
 * Today all presets are free to select; later pass `paymentsEnabled: true` to gate paid tiers.
 */
export function isDurationSelectable(
  preset: AuctionDurationPreset,
  options?: { paymentsEnabled?: boolean }
): boolean {
  if (!options?.paymentsEnabled) {
    return true;
  }
  return !preset.requiresPayment;
}

export function calculateAuctionEndFromDuration(
  durationId: AuctionDurationId,
  from: Date = new Date()
): string {
  const preset = getAuctionDurationPreset(durationId);
  if (!preset) {
    throw new Error("Invalid auction duration");
  }
  const endMs = from.getTime() + preset.hours * 60 * 60 * 1000;
  return new Date(endMs).toISOString();
}

export function formatAuctionEndDisplay(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
