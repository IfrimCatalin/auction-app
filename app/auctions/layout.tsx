import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Auctions",
  description: "Browse active GoBidMe auctions and open any listing for full details.",
};

export default function AuctionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
