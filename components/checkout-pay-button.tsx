"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { payOrderAction } from "@/app/orders/actions";
import { btnPrimary, btnSecondary } from "@/lib/ui-theme";

type CheckoutPayButtonProps = {
  orderId: string;
  disabled?: boolean;
};

export function CheckoutPayButton({ orderId, disabled = false }: CheckoutPayButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    paymentReference: string | null;
  } | null>(null);

  function handlePay() {
    setError(null);
    startTransition(async () => {
      const result = await payOrderAction(orderId);
      if (!result.ok) {
        setError(result.error ?? "Payment failed.");
        return;
      }
      setSuccess({ paymentReference: result.paymentReference ?? null });
      router.refresh();
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-4">
          <p className="text-sm font-semibold text-emerald-100">Payment successful</p>
          <p className="mt-2 text-sm text-emerald-100/90">
            Your order is paid. The seller can now prepare your shipment.
          </p>
          {success.paymentReference ? (
            <p className="mt-2 font-mono text-xs text-emerald-100/80">
              Reference: {success.paymentReference}
            </p>
          ) : null}
        </div>
        <Link href="/orders" className={`${btnPrimary} inline-flex`}>
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handlePay}
        disabled={disabled || pending}
        className={`${btnPrimary} w-full py-3 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {pending ? "Processing payment…" : "Pay now"}
      </button>
      <p className="text-center text-xs text-muted">
        Mock checkout — no card charged. Payment is recorded instantly for testing.
      </p>
      {error ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
