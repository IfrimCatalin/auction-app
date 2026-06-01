import { cardBase, cardHover, premiumCard, transitionInteractive } from "@/lib/ui-tokens";
import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
  premium?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const paddingMap = {
  none: "",
  sm: "p-5 sm:p-6",
  md: "p-6 sm:p-8",
  lg: "p-8 sm:p-10",
};

export function Card({
  hover = false,
  premium = false,
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        premium ? premiumCard : hover ? cardHover : cardBase,
        !premium && paddingMap[padding],
        premium && padding !== "none" && "p-0",
        premium && padding === "md" && "p-6 sm:p-8",
        transitionInteractive,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
