import Link from "next/link";
import { GobidMeLogo } from "@/components/gobidme-logo";
import { Card } from "@/components/ui/card";
import { pageShell } from "@/lib/ui-tokens";

type AuthFormShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
};

export function AuthFormShell({ title, description, children, footer }: AuthFormShellProps) {
  return (
    <main className={`${pageShell} flex min-h-screen items-center justify-center px-4 py-12 sm:px-6`}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <GobidMeLogo variant="auth" className="mx-auto" />
        </div>
        <Card padding="lg" className="shadow-lg shadow-black/40">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-muted">{description}</p>
          <div className="mt-7">{children}</div>
        </Card>
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </main>
  );
}

export function AuthFooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-medium text-accent underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
