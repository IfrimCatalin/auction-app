import Image from "next/image";
import Link from "next/link";
import gobidmeLogo from "@/public/gobidme-logo.png";

type GobidMeLogoProps = {
  className?: string;
  priority?: boolean;
  /** Nav/header (default) or larger centered auth treatment */
  variant?: "nav" | "auth";
};

/**
 * GoBidMe wordmark — `public/gobidme-logo.png` (static import busts image cache on file change).
 * No background box; sized for black premium theme.
 */
export function GobidMeLogo({
  className = "",
  priority = false,
  variant = "nav",
}: GobidMeLogoProps) {
  const sizeClasses =
    variant === "auth"
      ? "h-[52px] sm:h-[56px] md:h-[68px] lg:h-[72px]"
      : "h-11 sm:h-[52px] md:h-16 lg:h-[72px]";

  return (
    <Link
      href="/"
      aria-label="GoBidMe home"
      className={`inline-flex shrink-0 items-center transition hover:opacity-90 ${sizeClasses} ${className}`}
    >
      <Image
        src={gobidmeLogo}
        alt="GoBidMe"
        priority={priority}
        className={`h-full w-auto object-contain ${
          variant === "auth"
            ? "max-w-[min(360px,85vw)] object-center"
            : "max-w-[min(320px,72vw)] object-left"
        }`}
        sizes={
          variant === "auth"
            ? "(max-width: 768px) 280px, 360px"
            : "(max-width: 768px) 220px, 320px"
        }
      />
    </Link>
  );
}
