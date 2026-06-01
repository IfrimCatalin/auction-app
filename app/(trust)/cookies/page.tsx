import type { Metadata } from "next";
import Link from "next/link";
import { TrustPageBody, TrustPageHero, TrustSection } from "@/components/trust-page-layout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How GoBidMe uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <>
      <TrustPageHero
        eyebrow="Legal"
        title="Cookie Policy"
        description="Understanding how cookies help GoBidMe work—and what you can control."
      />
      <TrustPageBody>
        <TrustSection title="What are cookies?">
          <p>
            Cookies are small text files stored on your device when you visit a website. They help
            the site remember your session, preferences, and certain settings.
          </p>
        </TrustSection>

        <TrustSection title="Essential cookies">
          <p>
            These cookies are required for core functionality such as security, load balancing, and
            basic navigation. Without them, parts of GoBidMe may not work correctly.
          </p>
        </TrustSection>

        <TrustSection title="Authentication & session cookies">
          <p>
            When you sign in, we use session cookies (or equivalent storage) to keep you logged in
            and protect your account. Signing out clears session data associated with your visit.
          </p>
        </TrustSection>

        <TrustSection title="Analytics (placeholder)">
          <p>
            We may use analytics cookies in the future to understand how visitors use the
            marketplace—such as popular categories and error rates—so we can improve the experience.
            If enabled, we will update this page with the tools used and opt-out options where
            required.
          </p>
        </TrustSection>

        <TrustSection title="Managing cookies">
          <p>
            Most browsers let you block or delete cookies in settings. Blocking essential or session
            cookies may prevent you from signing in or placing bids. For more on how we use data,
            see our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </TrustSection>
      </TrustPageBody>
    </>
  );
}
