-- GoBidMe: optional reserve price on listings
-- NULL = no reserve. Never expose reserve_price to buyers in the UI.

alter table public.listings
add column if not exists reserve_price numeric(12,2);

alter table public.listings
drop constraint if exists listings_reserve_above_starting;

alter table public.listings
add constraint listings_reserve_above_starting
check (reserve_price is null or reserve_price > starting_price);
