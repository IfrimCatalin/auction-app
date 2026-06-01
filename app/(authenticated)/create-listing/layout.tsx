import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create listing",
  description: "Publish a new live auction listing on GoBidMe.",
};

export default function CreateListingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
