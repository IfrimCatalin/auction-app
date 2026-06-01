"use client";

import { useEffect, useRef, useState } from "react";
import { formatListingPrice } from "@/lib/listing-price";

type LivePriceProps = {
  value: number;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export function LivePrice({ value, className = "", size = "md" }: LivePriceProps) {
  const previousValue = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (previousValue.current === value) {
      return;
    }

    previousValue.current = value;
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 700);
    return () => window.clearTimeout(timer);
  }, [value]);

  return (
    <p
      className={`font-semibold tabular-nums tracking-tight transition-all duration-500 ${sizeClass[size]} ${
        pulse ? "scale-[1.02] text-accent live-price-pulse" : "text-ink"
      } ${className}`}
    >
      {formatListingPrice(value)}
    </p>
  );
}
