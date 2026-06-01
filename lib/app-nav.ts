import type { AppNavItem } from "@/components/app-navbar";

export function buildAppNavItems(options?: {
  unreadMessages?: number;
}): AppNavItem[] {
  const unread = options?.unreadMessages ?? 0;
  return [
    { href: "/auctions", label: "Auctions" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/orders", label: "Orders" },
    { href: "/messages", label: "Messages", badge: unread > 0 ? unread : undefined },
    { href: "/my-listings", label: "Listings" },
  ];
}
