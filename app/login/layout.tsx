import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to your GoBidMe account to bid, list items, and manage auctions.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
