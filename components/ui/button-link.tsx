import Link from "next/link";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/button-variants";
import { cn } from "@/lib/cn";

type ButtonLinkProps = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

/** Next.js Link styled as a design-system button — use on server pages for CTAs */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={cn(buttonClasses(variant, size), className)}>
      {children}
    </Link>
  );
}
