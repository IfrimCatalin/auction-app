import { PublicNavbar } from "@/components/public-navbar";
import { SiteFooter } from "@/components/site-footer";
import { pageShell } from "@/lib/ui-tokens";

type PublicPageShellProps = {
  children: React.ReactNode;
  isAuthenticated: boolean;
};

export function PublicPageShell({ children, isAuthenticated }: PublicPageShellProps) {
  return (
    <div className={`${pageShell} flex min-h-screen flex-col`}>
      <PublicNavbar isAuthenticated={isAuthenticated} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
