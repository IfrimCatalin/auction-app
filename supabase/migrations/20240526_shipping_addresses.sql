-- GoBidMe: shipping addresses for won auctions (run in Supabase SQL Editor)

create table if not exists public.shipping_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) >= 2 and char_length(full_name) <= 120),
  phone text not null check (char_length(trim(phone)) >= 6 and char_length(phone) <= 40),
  country text not null check (char_length(trim(country)) >= 2 and char_length(country) <= 80),
  city text not null check (char_length(trim(city)) >= 2 and char_length(city) <= 80),
  county_region text not null check (char_length(trim(county_region)) >= 2 and char_length(county_region) <= 80),
  street_address text not null check (char_length(trim(street_address)) >= 3 and char_length(street_address) <= 200),
  postal_code text not null check (char_length(trim(postal_code)) >= 2 and char_length(postal_code) <= 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_addresses_one_per_listing_per_user unique (user_id, listing_id)
);

create index if not exists shipping_addresses_user_id_idx
  on public.shipping_addresses (user_id);

create index if not exists shipping_addresses_listing_id_idx
  on public.shipping_addresses (listing_id);

alter table public.shipping_addresses enable row level security;

drop policy if exists "Buyers can view own shipping addresses" on public.shipping_addresses;
create policy "Buyers can view own shipping addresses"
on public.shipping_addresses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Sellers can view shipping for their listings" on public.shipping_addresses;
create policy "Sellers can view shipping for their listings"
on public.shipping_addresses
for select
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = shipping_addresses.listing_id
      and l.seller_id = auth.uid()
  )
);

drop policy if exists "Buyers can insert own shipping addresses" on public.shipping_addresses;
create policy "Buyers can insert own shipping addresses"
on public.shipping_addresses
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Buyers can update own shipping addresses" on public.shipping_addresses;
create policy "Buyers can update own shipping addresses"
on public.shipping_addresses
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_shipping_addresses_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_shipping_addresses_updated_at on public.shipping_addresses;
create trigger trg_shipping_addresses_updated_at
before update on public.shipping_addresses
for each row execute function public.set_shipping_addresses_updated_at();

create or replace function public.validate_shipping_address_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_status text;
  v_auction_end timestamptz;
  v_reserve_price numeric(12,2);
  v_current_price numeric(12,2);
  v_winner_id uuid;
begin
  if tg_op = 'UPDATE' then
    if new.user_id <> old.user_id or new.listing_id <> old.listing_id then
      raise exception 'Cannot change order ownership of a shipping address';
    end if;
  end if;

  select seller_id, status, auction_end, reserve_price, current_price
    into v_seller_id, v_status, v_auction_end, v_reserve_price, v_current_price
  from public.listings
  where id = new.listing_id;

  if v_seller_id is null then
    raise exception 'Listing not found';
  end if;

  if new.user_id = v_seller_id then
    raise exception 'Seller cannot add a shipping address as the buyer';
  end if;

  if v_status <> 'ended' and v_auction_end > now() then
    raise exception 'Auction must be ended before saving a delivery address';
  end if;

  if v_reserve_price is not null and v_current_price < v_reserve_price then
    raise exception 'Reserve not met — delivery address not allowed';
  end if;

  select bidder_id
    into v_winner_id
  from public.bids
  where listing_id = new.listing_id
  order by amount desc, created_at desc
  limit 1;

  if v_winner_id is null or v_winner_id <> new.user_id then
    raise exception 'Only the winning bidder can save a delivery address';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_shipping_address_write on public.shipping_addresses;
create trigger trg_validate_shipping_address_write
before insert or update on public.shipping_addresses
for each row execute function public.validate_shipping_address_write();
