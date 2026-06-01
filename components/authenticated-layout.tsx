import { AppNavbar } from "@/components/app-navbar";
import { buildAppNavItems } from "@/lib/app-nav";
import { container, pageShell } from "@/lib/ui-tokens";

type AuthenticatedLayoutProps = {
  children: React.ReactNode;
  unreadMessages?: number;
  unreadNotifications?: number;
  showAdmin?: boolean;
};

export function AuthenticatedLayout({
  children,
  unreadMessages = 0,
  unreadNotifications = 0,
  showAdmin = false,
}: AuthenticatedLayoutProps) {
  return (
    <div className={`${pageShell} flex min-h-screen flex-col`}>
      <AppNavbar
        isAuthenticated
        items={buildAppNavItems({ unreadMessages })}
        unreadNotifications={unreadNotifications}
        showAdmin={showAdmin}
      />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

export function AuthenticatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${container} pb-16 pt-8 sm:pt-10 lg:pt-12 ${className ?? ""}`}>
      {children}
    </section>
  );
}
