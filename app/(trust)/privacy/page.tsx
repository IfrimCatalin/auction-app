import type { Metadata } from "next";
import Link from "next/link";
import { LegalDisclaimer, TrustPageBody, TrustPageHero, TrustSection } from "@/components/trust-page-layout";
import { SUPPORT_EMAIL } from "@/lib/site-links";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How GoBidMe collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <>
      <TrustPageHero
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we handle your information when you use GoBidMe."
      />
      <TrustPageBody>
        <LegalDisclaimer />

        <TrustSection title="Account data">
          <p>
            When you register, we collect email and authentication credentials managed through our
            auth provider. We use this to secure your account and provide access to marketplace
            features.
          </p>
        </TrustSection>

        <TrustSection title="Profile data">
          <p>
            Optional profile fields such as username, display name, and avatar are shown to other
            users where relevant (for example, on listings and reviews). You can update profile
            information from your account settings.
          </p>
        </TrustSection>

        <TrustSection title="Listings">
          <p>
            Listing content you create—including titles, descriptions, images, and pricing—is
            stored to display auctions and process orders. Public listings are visible to visitors
            and signed-in users browsing the marketplace.
          </p>
        </TrustSection>

        <TrustSection title="Messages">
          <p>
            Conversations between buyers and sellers are stored to deliver messaging features and
            support dispute resolution. Do not share sensitive financial details in chat; use
            official order and payment flows.
          </p>
        </TrustSection>

        <TrustSection title="Orders & shipping information">
          <p>
            Order records include buyer and seller identifiers, final price, payment status, and
            fulfillment data such as tracking numbers. Shipping addresses provided for fulfillment
            are used to complete transactions between parties.
          </p>
        </TrustSection>

        <TrustSection title="Cookies">
          <p>
            We use cookies and similar technologies for essential site operation, sessions, and
            preferences. See our <Link href="/cookies">Cookie Policy</Link> for details.
          </p>
        </TrustSection>

        <TrustSection title="Security">
          <p>
            We apply industry-standard measures including encrypted connections and access controls.
            No system is perfectly secure; please use a strong password and report suspicious
            activity promptly.
          </p>
        </TrustSection>

        <TrustSection title="Your rights">
          <p>
            Depending on your location, you may have rights to access, correct, or delete personal
            data. Contact us to submit a request and we will respond in accordance with applicable
            law.
          </p>
        </TrustSection>

        <TrustSection title="Contact">
          <p>
            Privacy questions:{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent">
              {SUPPORT_EMAIL}
            </a>{" "}
            or the <Link href="/contact">Contact</Link> page.
          </p>
        </TrustSection>
      </TrustPageBody>
    </>
  );
}
