import type { Metadata } from "next";
import Link from "next/link";
import { TrustPageBody, TrustPageHero, TrustSection } from "@/components/trust-page-layout";

export const metadata: Metadata = {
  title: "Safety",
  description: "Buyer and seller safety tips, reporting listings, and scam prevention on GoBidMe.",
};

export default function SafetyPage() {
  return (
    <>
      <TrustPageHero
        eyebrow="Trust"
        title="Safety center"
        description="Practical guidance for buying and selling with confidence on GoBidMe."
      />
      <TrustPageBody>
        <TrustSection title="Buyer safety">
          <ul>
            <li>Review listing photos, description, and seller profile before bidding</li>
            <li>Pay only through official order checkout—not external links in messages</li>
            <li>Confirm delivery only when you have received the item as described</li>
            <li>Leave honest reviews after completed orders to help the community</li>
          </ul>
        </TrustSection>

        <TrustSection title="Seller safety">
          <ul>
            <li>Ship only after payment is confirmed on the order</li>
            <li>Use tracked shipping and enter accurate carrier and tracking details</li>
            <li>Keep proof of shipment and communication on-platform</li>
            <li>Do not accept off-platform payments that bypass GoBidMe protections</li>
          </ul>
        </TrustSection>

        <TrustSection title="Report a listing">
          <p>
            If a listing appears misleading, prohibited, or suspicious, use{" "}
            <strong className="text-ink">Report listing</strong> on the auction page. Choose a
            reason and submit details. Our moderation team reviews reports and may hide or cancel
            listings that violate marketplace rules.
          </p>
        </TrustSection>

        <TrustSection title="Messaging safety">
          <p>
            Use GoBidMe Messages for order-related communication. Never share passwords, one-time
            codes, or full payment card details in chat. Be wary of requests to complete payment
            outside the platform.
          </p>
        </TrustSection>

        <TrustSection title="Scam prevention">
          <ul>
            <li>Too-good-to-be-true prices and pressure to pay quickly are red flags</li>
            <li>Verify authenticity for high-value collectibles when possible</li>
            <li>Report suspicious accounts and listings immediately</li>
          </ul>
        </TrustSection>

        <TrustSection title="Counterfeit & prohibited items">
          <p>
            Counterfeit goods, stolen property, and illegal items are not allowed. Sellers are
            responsible for authenticity claims. Buyers should report listings that appear to violate
            these rules. See <Link href="/terms">Terms of Service</Link> for full policies.
          </p>
        </TrustSection>

        <p className="text-center text-sm text-muted">
          Need help? Visit <Link href="/help">Help</Link> or{" "}
          <Link href="/contact">Contact support</Link>.
        </p>
      </TrustPageBody>
    </>
  );
}
