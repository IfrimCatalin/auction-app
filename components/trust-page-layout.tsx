import { card, headingPage, sectionMuted } from "@/lib/ui-theme";

type TrustPageLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function TrustPageHero({ eyebrow, title, description }: Omit<TrustPageLayoutProps, "children">) {
  return (
    <div className="mx-auto max-w-3xl px-5 pt-10 pb-6 text-center lg:px-8 lg:pt-14">
      {eyebrow ? <p className="text-sm font-medium text-accent">{eyebrow}</p> : null}
      <h1 className={`mt-2 ${headingPage}`}>{title}</h1>
      {description ? <p className={`mt-4 ${sectionMuted}`}>{description}</p> : null}
    </div>
  );
}

export function TrustPageBody({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-5 pb-16 lg:px-8">{children}</div>
  );
}

type TrustSectionProps = {
  title: string;
  children: React.ReactNode;
  id?: string;
};

export function TrustSection({ title, children, id }: TrustSectionProps) {
  return (
    <section id={id} className={`${card} p-6 sm:p-8`}>
      <h2 className="text-lg font-semibold tracking-tight text-ink sm:text-xl">{title}</h2>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted [&_a]:font-medium [&_a]:text-accent [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:ml-4 [&_li]:list-disc [&_ol]:space-y-2 [&_ol]:pl-1 [&_ul]:space-y-2 [&_ul]:pl-1">
        {children}
      </div>
    </section>
  );
}

export function LegalDisclaimer() {
  return (
    <p className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3 text-xs leading-relaxed text-muted">
      This page is provided as a general template and should be reviewed by a qualified legal
      professional before launch.
    </p>
  );
}
