import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { TrustPageBody, TrustPageHero } from "@/components/trust-page-layout";
import { HELP_FAQ_ITEMS } from "@/lib/help-faq";
import { card } from "@/lib/ui-theme";

export const metadata: Metadata = {
  title: "Help",
  description: "Frequently asked questions about bidding, payments, shipping, and more on GoBidMe.",
};

export default function HelpPage() {
  return (
    <>
      <TrustPageHero
        eyebrow="Help center"
        title="Frequently asked questions"
        description="Quick answers about accounts, bidding, orders, messaging, and safety."
      />
      <TrustPageBody>
        <div className={`${card} p-5 sm:p-6`}>
          <p className="text-sm text-muted">
            Can&apos;t find what you need?{" "}
            <Link href="/contact" className="font-medium text-accent hover:underline">
              Contact support
            </Link>{" "}
            or read our <Link href="/safety" className="font-medium text-accent hover:underline">
              Safety
            </Link>{" "}
            guide.
          </p>
        </div>

        <FaqAccordion items={HELP_FAQ_ITEMS} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/about"
            className="rounded-3xl border border-border bg-surface p-5 transition hover:border-accent/30"
          >
            <p className="text-sm font-semibold text-ink">About GoBidMe</p>
            <p className="mt-1 text-sm text-muted">Learn how the marketplace works.</p>
          </Link>
          <Link
            href="/auctions"
            className="rounded-3xl border border-border bg-surface p-5 transition hover:border-accent/30"
          >
            <p className="text-sm font-semibold text-ink">Browse auctions</p>
            <p className="mt-1 text-sm text-muted">Discover live listings now.</p>
          </Link>
        </div>
      </TrustPageBody>
    </>
  );
}
