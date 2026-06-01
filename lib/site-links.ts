export type SiteLink = {
  href: string;
  label: string;
};

export const PUBLIC_NAV_LINKS: SiteLink[] = [
  { href: "/auctions", label: "Auctions" },
  { href: "/about", label: "About" },
  { href: "/help", label: "Help" },
  { href: "/contact", label: "Contact" },
];

export const FOOTER_LINKS: SiteLink[] = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/help", label: "Help" },
  { href: "/safety", label: "Safety" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
];

export const SUPPORT_EMAIL = "support@gobidme.com";
