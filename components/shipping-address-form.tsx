"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ShippingAddressDisplay } from "@/components/shipping-address-display";
import { createClient } from "@/lib/supabase/client";
import {
  normalizeShippingAddressInput,
  validateShippingAddressInput,
  type ShippingAddress,
  type ShippingAddressInput,
} from "@/lib/shipping-addresses";

type ShippingAddressFormProps = {
  listingId: string;
  userId: string;
  initialAddress: ShippingAddress | null;
};

const emptyInput: ShippingAddressInput = {
  full_name: "",
  phone: "",
  country: "",
  city: "",
  county_region: "",
  street_address: "",
  postal_code: "",
};

function inputFromAddress(address: ShippingAddress | null): ShippingAddressInput {
  if (!address) return emptyInput;
  return {
    full_name: address.full_name,
    phone: address.phone,
    country: address.country,
    city: address.city,
    county_region: address.county_region,
    street_address: address.street_address,
    postal_code: address.postal_code,
  };
}

const fieldClass =
  "w-full rounded-2xl border border-border bg-page-dark px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent disabled:opacity-60";

export function ShippingAddressForm({
  listingId,
  userId,
  initialAddress,
}: ShippingAddressFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isEditing, setIsEditing] = useState(!initialAddress);
  const [form, setForm] = useState<ShippingAddressInput>(() => inputFromAddress(initialAddress));
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof ShippingAddressInput, string>>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedAddress, setSavedAddress] = useState<ShippingAddress | null>(initialAddress);

  const updateField = (field: keyof ShippingAddressInput, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const normalized = normalizeShippingAddressInput(form);
    const errors = validateShippingAddressInput(normalized);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("shipping_addresses")
      .upsert(
        {
          user_id: userId,
          listing_id: listingId,
          ...normalized,
        },
        { onConflict: "user_id,listing_id" }
      )
      .select(
        "id, user_id, listing_id, full_name, phone, country, city, county_region, street_address, postal_code, created_at, updated_at"
      )
      .single();

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSavedAddress(data as ShippingAddress);
    setIsEditing(false);
    setLoading(false);
    router.refresh();
  };

  if (savedAddress && !isEditing) {
    return (
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Delivery
          </p>
          <button
            type="button"
            onClick={() => {
              setForm(inputFromAddress(savedAddress));
              setIsEditing(true);
            }}
            className="text-xs font-medium text-accent underline-offset-2 hover:underline"
          >
            Edit address
          </button>
        </div>
        <div className="mt-2">
          <ShippingAddressDisplay address={savedAddress} />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Delivery address
      </p>
      <p className="mt-1 text-xs text-muted">
        Add where the seller should send this item. Carrier labels are not connected yet.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-ink/90">Full name</span>
            <input
              type="text"
              value={form.full_name}
              onChange={(event) => updateField("full_name", event.target.value)}
              disabled={loading}
              autoComplete="name"
              className={fieldClass}
            />
            {fieldErrors.full_name ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.full_name}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink/90">Phone</span>
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              disabled={loading}
              autoComplete="tel"
              className={fieldClass}
            />
            {fieldErrors.phone ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.phone}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink/90">Country</span>
            <input
              type="text"
              value={form.country}
              onChange={(event) => updateField("country", event.target.value)}
              disabled={loading}
              autoComplete="country-name"
              className={fieldClass}
            />
            {fieldErrors.country ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.country}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink/90">City</span>
            <input
              type="text"
              value={form.city}
              onChange={(event) => updateField("city", event.target.value)}
              disabled={loading}
              autoComplete="address-level2"
              className={fieldClass}
            />
            {fieldErrors.city ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.city}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink/90">County / region</span>
            <input
              type="text"
              value={form.county_region}
              onChange={(event) => updateField("county_region", event.target.value)}
              disabled={loading}
              autoComplete="address-level1"
              className={fieldClass}
            />
            {fieldErrors.county_region ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.county_region}</span>
            ) : null}
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-ink/90">Street address</span>
            <input
              type="text"
              value={form.street_address}
              onChange={(event) => updateField("street_address", event.target.value)}
              disabled={loading}
              autoComplete="street-address"
              className={fieldClass}
            />
            {fieldErrors.street_address ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.street_address}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink/90">Postal code</span>
            <input
              type="text"
              value={form.postal_code}
              onChange={(event) => updateField("postal_code", event.target.value)}
              disabled={loading}
              autoComplete="postal-code"
              className={fieldClass}
            />
            {fieldErrors.postal_code ? (
              <span className="mt-1 block text-xs text-rose-300">{fieldErrors.postal_code}</span>
            ) : null}
          </label>
        </div>

        {errorMessage ? (
          <p className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? "Saving…" : savedAddress ? "Update address" : "Save delivery address"}
          </button>
          {savedAddress ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => setIsEditing(false)}
              className="rounded-full border border-border bg-page px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/40"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
