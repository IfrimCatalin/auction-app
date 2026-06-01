import { formatShippingAddressLines, type ShippingAddress } from "@/lib/shipping-addresses";

type ShippingAddressDisplayProps = {
  address: ShippingAddress;
  heading?: string;
};

export function ShippingAddressDisplay({
  address,
  heading = "Delivery address",
}: ShippingAddressDisplayProps) {
  const lines = formatShippingAddressLines(address);

  return (
    <div className="rounded-2xl border border-accent/25 bg-page px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">{heading}</p>
      <address className="mt-2 space-y-0.5 text-sm not-italic leading-relaxed text-ink/90">
        {lines.map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  );
}
