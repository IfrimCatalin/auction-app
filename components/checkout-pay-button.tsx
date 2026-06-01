"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { payOrderAction } from "@/app/(authenticated)/orders/actions";
import { Button } from "@/components/ui/button";
import { buttonClasses } from "@/lib/button-variants";
import { errorBox, successBox } from "@/lib/ui-tokens";

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
        <div className={successBox}>
          <p className="font-semibold text-ink">Payment successful</p>
          <p className="mt-2 text-sm text-muted">
            Your order is paid. The seller can now prepare your shipment.
          </p>
          {success.paymentReference ? (
            <p className="mt-2 font-mono text-xs text-muted">
              Reference: {success.paymentReference}
            </p>
          ) : null}
        </div>
        <Link href="/orders" className={buttonClasses("primary", "md")}>
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={handlePay}
        disabled={disabled || pending}
        loading={pending}
        fullWidth
        size="lg"
      >
        Pay now
      </Button>
      <p className="text-center text-xs text-muted">
        Mock checkout — no card charged. Payment is recorded instantly for testing.
      </p>
      {error ? <p className={errorBox} role="alert">{error}</p> : null}
    </div>
  );
}
