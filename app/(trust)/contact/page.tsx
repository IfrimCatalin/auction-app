import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { TrustPageBody, TrustPageHero, TrustSection } from "@/components/trust-page-layout";
import { SUPPORT_EMAIL } from "@/lib/site-links";
export const metadata: Metadata = {
  title: "Contact",
  description: "Contact GoBidMe support for help with auctions, orders, and your account.",
};

export default function ContactPage() {
  return (
    <>
      <TrustPageHero
        eyebrow="Support"
        title="Contact us"
        description="Questions about bidding, orders, or your account? We are here to help."
      />
      <TrustPageBody>
        <TrustSection title="Email support">
          <p>
            For general support, email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-accent">
              {SUPPORT_EMAIL}
            </a>
            . Please include your username and order ID when relevant.
          </p>
        </TrustSection>

        <div>
          <h2 className="text-lg font-semibold text-ink px-1">Send a message</h2>
          <p className="mt-2 px-1 text-sm text-muted">
            Use the form below and we will respond when support is available.
          </p>
          <div className="mt-4">
            <ContactForm />
          </div>
        </div>

        <p className="text-center text-sm text-muted">
          Looking for quick answers? Visit our{" "}
          <Link href="/help" className="font-medium text-accent hover:underline">
            Help center
          </Link>
          .
        </p>
      </TrustPageBody>
    </>
  );
}
