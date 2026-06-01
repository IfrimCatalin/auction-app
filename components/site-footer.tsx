import Link from "next/link";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { FOOTER_LINKS } from "@/lib/site-links";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <GobidMeLogo className="h-12 md:h-14" />
            <p className="mt-3 text-sm text-muted">
              Premium auctions for collectors and trusted sellers.
            </p>
          </div>
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-3 md:grid-cols-4"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} GoBidMe. All rights reserved.</p>
          <p className="text-xs sm:text-sm">Rare finds. Honest bids.</p>
        </div>
      </div>
    </footer>
  );
}
