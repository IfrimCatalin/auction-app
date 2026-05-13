import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your GoBidMe account and join premium live auctions.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
