import type { Metadata } from "next";
import Link from "next/link";
import { LegalDisclaimer, TrustPageBody, TrustPageHero, TrustSection } from "@/components/trust-page-layout";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "GoBidMe marketplace terms for buyers, sellers, listings, bids, and moderation.",
};

export default function TermsPage() {
  return (
    <>
      <TrustPageHero
        eyebrow="Legal"
        title="Terms of Service"
        description="Rules for using GoBidMe as a buyer or seller on our auction marketplace."
      />
      <TrustPageBody>
        <LegalDisclaimer />

        <TrustSection title="1. Account responsibility">
          <p>
            You are responsible for keeping your login credentials secure and for all activity under
            your account. Provide accurate registration information and notify us promptly if you
            suspect unauthorized access.
          </p>
        </TrustSection>

        <TrustSection title="2. Listings">
          <p>
            Sellers must describe items accurately, including condition, authenticity, and any
            material defects. Listings must include clear photos and comply with category rules.
            GoBidMe may remove or hide listings that violate these terms or applicable law.
          </p>
        </TrustSection>

        <TrustSection title="3. Bids are commitments">
          <p>
            Each bid you place is a binding offer to purchase the item at that price if you win
            the auction (subject to any reserve price). Do not bid unless you intend to complete
            the purchase and payment process.
          </p>
        </TrustSection>

        <TrustSection title="4. Seller obligations">
          <p>
            Winning bidders must be able to complete the transaction. Sellers must ship items as
            described, provide valid tracking when required, and respond to buyer messages in good
            faith within a reasonable time.
          </p>
        </TrustSection>

        <TrustSection title="5. Buyer payment obligations">
          <p>
            Buyers who win auctions must pay through the order checkout flow within the timeframe
            indicated on the platform. Failure to pay may result in order cancellation and account
            restrictions.
          </p>
        </TrustSection>

        <TrustSection title="6. Prohibited items">
          <p>
            You may not list stolen goods, counterfeit items, illegal products, weapons where
            prohibited, hazardous materials, or any item that violates law or our{" "}
            <Link href="/safety">Safety</Link> guidelines. We reserve the right to remove such
            listings without notice.
          </p>
        </TrustSection>

        <TrustSection title="7. Moderation rights">
          <p>
            GoBidMe may review reports, hide or cancel listings, suspend accounts, and take other
            actions to protect the marketplace. Moderation decisions are made at our discretion to
            enforce these terms and community standards.
          </p>
        </TrustSection>

        <TrustSection title="8. Disputes">
          <p>
            Buyers and sellers should first attempt to resolve issues through on-platform messaging
            and order tools. GoBidMe may assist informally but is not a party to transactions
            between users unless explicitly stated otherwise.
          </p>
        </TrustSection>

        <TrustSection title="9. Limitation of liability">
          <p>
            GoBidMe is provided &quot;as is.&quot; To the fullest extent permitted by law, we are not
            liable for indirect, incidental, or consequential damages arising from use of the
            platform, user conduct, or third-party services.
          </p>
        </TrustSection>

        <TrustSection title="10. Changes to terms">
          <p>
            We may update these terms from time to time. Continued use of GoBidMe after changes are
            posted constitutes acceptance of the updated terms. Material changes may be communicated
            on the site or by email where appropriate.
          </p>
        </TrustSection>

        <p className="text-center text-sm text-muted">
          Questions? See <Link href="/privacy">Privacy</Link> or{" "}
          <Link href="/contact">Contact</Link>.
        </p>
      </TrustPageBody>
    </>
  );
}
