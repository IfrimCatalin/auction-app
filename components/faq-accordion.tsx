"use client";

import { useState } from "react";
import { card } from "@/lib/ui-theme";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question} className={`${card} overflow-hidden`}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="text-sm font-semibold text-ink sm:text-base">{item.question}</span>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-accent"
                aria-hidden
              >
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-border px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6 sm:pb-6">
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
