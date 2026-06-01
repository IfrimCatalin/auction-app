-- GoBidMe: orders for completed auction sales (run in Supabase SQL Editor)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  final_price numeric(12,2) not null check (final_price > 0),
  status text not null default 'awaiting_payment' check (
    status in (
      'awaiting_payment',
      'paid',
      'preparing_shipment',
      'shipped',
      'delivered',
      'cancelled'
    )
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_one_per_listing unique (listing_id),
  constraint orders_buyer_not_seller check (buyer_id <> seller_id)
);

create index if not exists orders_buyer_id_created_at_idx
  on public.orders (buyer_id, created_at desc);

create index if not exists orders_seller_id_created_at_idx
  on public.orders (seller_id, created_at desc);

create index if not exists orders_listing_id_idx
  on public.orders (listing_id);

alter table public.orders enable row level security;

drop policy if exists "Buyers and sellers can view own orders" on public.orders;
create policy "Buyers and sellers can view own orders"
on public.orders
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Sellers can update own orders" on public.orders;
create policy "Sellers can update own orders"
on public.orders
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_orders_updated_at();

create or replace function public.validate_order_update()
returns trigger
language plpgsql
as $$
begin
  if new.listing_id <> old.listing_id
    or new.seller_id <> old.seller_id
    or new.buyer_id <> old.buyer_id
    or new.final_price <> old.final_price
    or new.created_at <> old.created_at
  then
    raise exception 'Only order status can be updated manually';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_order_update on public.orders;
create trigger trg_validate_order_update
before update on public.orders
for each row execute function public.validate_order_update();

create or replace function public.sync_auction_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.orders (listing_id, seller_id, buyer_id, final_price, status)
  select
    l.id,
    l.seller_id,
    winner.bidder_id,
    l.current_price,
    'awaiting_payment'
  from public.listings l
  inner join lateral (
    select b.bidder_id
    from public.bids b
    where b.listing_id = l.id
    order by b.amount desc, b.created_at desc
    limit 1
  ) winner on true
  where (
      l.status = 'ended'
      or l.auction_end <= now()
    )
    and winner.bidder_id is not null
    and winner.bidder_id <> l.seller_id
    and (
      l.reserve_price is null
      or l.current_price >= l.reserve_price
    )
  on conflict (listing_id) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.sync_auction_orders() from public;
grant execute on function public.sync_auction_orders() to anon, authenticated;

create or replace function public.expire_past_due_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.listings
  set status = 'ended'
  where status = 'active'
    and auction_end <= now();

  get diagnostics updated_count = row_count;

  perform public.sync_auction_orders();

  return updated_count;
end;
$$;

revoke all on function public.expire_past_due_listings() from public;
grant execute on function public.expire_past_due_listings() to anon, authenticated;
