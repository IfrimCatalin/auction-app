"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { cardBase, focusRing } from "@/lib/ui-tokens";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, description, children, className }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          cardBase,
          "relative z-10 w-full max-w-lg p-6 shadow-2xl shadow-black/60 sm:p-8",
          className
        )}
      >
        <h2 id="modal-title" className="text-lg font-semibold text-ink sm:text-xl">
          {title}
        </h2>
        {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
        {children ? <div className="mt-5">{children}</div> : null}
        <div className="mt-6 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} className={focusRing}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
