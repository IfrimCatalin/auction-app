import type { Metadata } from "next";
import Link from "next/link";
import { TrustPageBody, TrustPageHero, TrustSection } from "@/components/trust-page-layout";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about GoBidMe, a premium auction marketplace for collectors and trusted sellers.",
};

export default function AboutPage() {
  return (
    <>
      <TrustPageHero
        eyebrow="GoBidMe"
        title="A premium auction marketplace"
        description="Where collectors discover rare objects, sellers reach serious buyers, and every bid counts."
      />
      <TrustPageBody>
        <TrustSection title="Our mission">
          <p>
            GoBidMe brings together buyers and sellers who care about authenticity, presentation, and
            fair dealing. We focus on a calm, image-first experience—so the object and the bid stay
            front and center.
          </p>
        </TrustSection>

        <TrustSection title="For buyers">
          <ul>
            <li>Browse live auctions across curated categories</li>
            <li>Place bids in real time with clear minimums and reserve status</li>
            <li>Pay securely through order checkout after you win</li>
            <li>Track shipping and confirm delivery on your purchases</li>
            <li>Leave reviews after completed, delivered orders</li>
            <li>Message sellers directly from listings and orders</li>
          </ul>
        </TrustSection>

        <TrustSection title="For sellers">
          <ul>
            <li>Create listings with photos, reserve price, and auction end times</li>
            <li>Manage active auctions from your dashboard and My Listings</li>
            <li>Fulfill paid orders with shipment tracking built in</li>
            <li>Build reputation through buyer reviews</li>
          </ul>
        </TrustSection>

        <TrustSection title="Trust & safety">
          <p>
            We provide reporting tools, moderation, and guidance so the community can trade with
            confidence. Read our{" "}
            <Link href="/safety">Safety</Link> page and{" "}
            <Link href="/help">Help center</Link> for practical tips.
          </p>
        </TrustSection>

        <p className="text-center text-sm text-muted">
          Ready to explore?{" "}
          <Link href="/auctions" className="font-medium text-accent hover:underline">
            Browse auctions
          </Link>{" "}
          or{" "}
          <Link href="/contact" className="font-medium text-accent hover:underline">
            contact us
          </Link>
          .
        </p>
      </TrustPageBody>
    </>
  );
}
