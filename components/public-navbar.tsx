"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { buttonClasses } from "@/lib/button-variants";
import { cn } from "@/lib/cn";
import { focusRing, headerShell, navInner, navLink, navLinkActive } from "@/lib/ui-tokens";
import { PUBLIC_NAV_LINKS } from "@/lib/site-links";

type PublicNavbarProps = {
  isAuthenticated: boolean;
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicNavbar({ isAuthenticated }: PublicNavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className={headerShell}>
      <nav className={navInner} aria-label="Main">
        <GobidMeLogo />
        <ul className="hidden items-center gap-1 md:flex">
          {[{ href: "/auctions", label: "Auctions" }, ...PUBLIC_NAV_LINKS].map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn("rounded-full px-3 py-2", active ? navLinkActive : navLink, focusRing)}
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-2">
          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className={buttonClasses("primary", "md")}
          >
            {isAuthenticated ? "Dashboard" : "Sign in"}
          </Link>
          <button
            type="button"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-elevated md:hidden",
              focusRing
            )}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </nav>
      {menuOpen ? (
        <ul className="space-y-1 border-t border-border px-4 py-4 md:hidden">
          {[{ href: "/auctions", label: "Auctions" }, ...PUBLIC_NAV_LINKS].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "block rounded-xl px-4 py-3 font-medium",
                  isActivePath(pathname, link.href) ? "bg-accent/10 text-accent" : "text-ink",
                  focusRing
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
