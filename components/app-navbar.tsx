"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/lib/button-variants";
import { cn } from "@/lib/cn";
import { focusRing, headerShell, navInner, navLink, navLinkActive } from "@/lib/ui-tokens";

export type AppNavItem = {
  href: string;
  label: string;
  badge?: number;
};

type AppNavbarProps = {
  isAuthenticated: boolean;
  items?: AppNavItem[];
  unreadNotifications?: number;
  showAdmin?: boolean;
  rightSlot?: React.ReactNode;
};

const DEFAULT_AUTH_ITEMS: AppNavItem[] = [
  { href: "/auctions", label: "Auctions" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/orders", label: "Orders" },
  { href: "/messages", label: "Messages" },
  { href: "/my-listings", label: "Listings" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AppNavbar({
  isAuthenticated,
  items,
  unreadNotifications = 0,
  showAdmin = false,
  rightSlot,
}: AppNavbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    ...(items ?? (isAuthenticated ? DEFAULT_AUTH_ITEMS : [])),
    ...(showAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  return (
    <header className={headerShell}>
      <nav className={navInner} aria-label="Main">
        <GobidMeLogo />

        {navItems.length > 0 ? (
          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "rounded-full px-3 py-2",
                      active ? navLinkActive : navLink,
                      focusRing
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    {item.badge ? <NavCount count={item.badge} /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="flex items-center gap-2">
          {rightSlot}
          {isAuthenticated ? (
            <>
              <Link
                href="/notifications"
                className={cn(
                  "relative hidden rounded-full border border-border bg-elevated p-2.5 transition sm:inline-flex",
                  isActivePath(pathname, "/notifications")
                    ? "border-accent/50 text-accent"
                    : "text-muted hover:border-accent/40 hover:text-ink",
                  focusRing
                )}
                aria-label={
                  unreadNotifications > 0
                    ? `Notifications, ${unreadNotifications} unread`
                    : "Notifications"
                }
                aria-current={isActivePath(pathname, "/notifications") ? "page" : undefined}
              >
                <span className="text-sm" aria-hidden>
                  🔔
                </span>
                {unreadNotifications > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-black">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                ) : null}
              </Link>
              <Link
                href="/profile"
                className={cn(
                  buttonClasses("ghost", "sm"),
                  "hidden sm:inline-flex",
                  isActivePath(pathname, "/profile") && "text-accent"
                )}
                aria-current={isActivePath(pathname, "/profile") ? "page" : undefined}
              >
                Profile
              </Link>
              <div className="hidden sm:block">
                <LogoutButton />
              </div>
            </>
          ) : (
            <Link href="/login" className={buttonClasses("primary", "md")}>
              Sign in
            </Link>
          )}

          {navItems.length > 0 ? (
            <button
              type="button"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-elevated text-ink lg:hidden",
                focusRing
              )}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="sr-only">{menuOpen ? "Close" : "Menu"}</span>
              <span className="text-lg leading-none" aria-hidden>
                {menuOpen ? "×" : "☰"}
              </span>
            </button>
          ) : null}
        </div>
      </nav>

      {menuOpen && navItems.length > 0 ? (
        <div
          id="mobile-nav"
          className="border-t border-border bg-page lg:hidden"
          role="dialog"
          aria-label="Mobile navigation"
        >
          <ul className="mx-auto w-full max-w-6xl space-y-1 px-4 py-4 sm:px-6 lg:px-8">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium",
                      active ? "bg-accent/10 text-accent" : "text-ink hover:bg-elevated",
                      focusRing
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                    {item.badge ? <Badge variant="accent">{item.badge}</Badge> : null}
                  </Link>
                </li>
              );
            })}
            {[
              { href: "/watchlist", label: "Watchlist" },
              { href: "/notifications", label: "Notifications", badge: unreadNotifications },
              { href: "/profile", label: "Profile" },
              { href: "/create-listing", label: "Sell an item" },
            ].map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <li
                  key={link.href}
                  className={link.href === "/watchlist" ? "border-t border-border pt-3" : undefined}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 font-medium",
                      active ? "bg-accent/10 text-accent" : "text-ink hover:bg-elevated",
                      focusRing
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                    {link.badge && link.badge > 0 ? (
                      <Badge variant="accent">{link.badge > 99 ? "99+" : link.badge}</Badge>
                    ) : null}
                  </Link>
                </li>
              );
            })}
            {isAuthenticated ? (
              <li className="border-t border-border pt-3 sm:hidden">
                <LogoutButton />
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
