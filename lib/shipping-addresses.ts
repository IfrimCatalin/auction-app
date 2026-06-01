import type { SupabaseClient } from "@supabase/supabase-js";

export type ShippingAddress = {
  id: string;
  user_id: string;
  listing_id: string;
  full_name: string;
  phone: string;
  country: string;
  city: string;
  county_region: string;
  street_address: string;
  postal_code: string;
  created_at: string;
  updated_at: string;
};

export type ShippingAddressInput = {
  full_name: string;
  phone: string;
  country: string;
  city: string;
  county_region: string;
  street_address: string;
  postal_code: string;
};

export type ShippingAddressFieldErrors = Partial<Record<keyof ShippingAddressInput, string>>;

const SHIPPING_SELECT =
  "id, user_id, listing_id, full_name, phone, country, city, county_region, street_address, postal_code, created_at, updated_at";

export function validateShippingAddressInput(
  input: ShippingAddressInput
): ShippingAddressFieldErrors {
  const errors: ShippingAddressFieldErrors = {};

  const fullName = input.full_name.trim();
  if (fullName.length < 2) {
    errors.full_name = "Enter the recipient full name.";
  }

  const phone = input.phone.trim();
  if (phone.length < 6) {
    errors.phone = "Enter a valid phone number.";
  }

  const country = input.country.trim();
  if (country.length < 2) {
    errors.country = "Enter a country.";
  }

  const city = input.city.trim();
  if (city.length < 2) {
    errors.city = "Enter a city.";
  }

  const countyRegion = input.county_region.trim();
  if (countyRegion.length < 2) {
    errors.county_region = "Enter a county or region.";
  }

  const street = input.street_address.trim();
  if (street.length < 3) {
    errors.street_address = "Enter a street address.";
  }

  const postalCode = input.postal_code.trim();
  if (postalCode.length < 2) {
    errors.postal_code = "Enter a postal code.";
  }

  return errors;
}

export function normalizeShippingAddressInput(
  input: ShippingAddressInput
): ShippingAddressInput {
  return {
    full_name: input.full_name.trim(),
    phone: input.phone.trim(),
    country: input.country.trim(),
    city: input.city.trim(),
    county_region: input.county_region.trim(),
    street_address: input.street_address.trim(),
    postal_code: input.postal_code.trim(),
  };
}

export function formatShippingAddressLines(address: ShippingAddress): string[] {
  return [
    address.full_name,
    address.street_address,
    `${address.city}, ${address.county_region} ${address.postal_code}`,
    address.country,
    `Phone: ${address.phone}`,
  ];
}

export async function getShippingAddressesForListings(
  supabase: SupabaseClient,
  userId: string,
  listingIds: string[]
): Promise<Map<string, ShippingAddress>> {
  if (listingIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .select(SHIPPING_SELECT)
    .eq("user_id", userId)
    .in("listing_id", listingIds);

  if (error || !data?.length) {
    return new Map();
  }

  return new Map(
    (data as ShippingAddress[]).map((address) => [address.listing_id, address])
  );
}

/** Seller view: RLS allows reading addresses for own listings. */
export async function getShippingAddressesByListingIds(
  supabase: SupabaseClient,
  listingIds: string[]
): Promise<Map<string, ShippingAddress>> {
  if (listingIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .select(SHIPPING_SELECT)
    .in("listing_id", listingIds);

  if (error || !data?.length) {
    return new Map();
  }

  return new Map(
    (data as ShippingAddress[]).map((address) => [address.listing_id, address])
  );
}

export async function getShippingAddressForListing(
  supabase: SupabaseClient,
  listingId: string
): Promise<ShippingAddress | null> {
  const { data, error } = await supabase
    .from("shipping_addresses")
    .select(SHIPPING_SELECT)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as ShippingAddress;
}
