-- GoBidMe: order payment fields and mock checkout (run in Supabase SQL Editor before checkout UI)
-- Requires: public.orders, public.is_admin()

-- =========================================================
-- PAYMENT COLUMNS ON ORDERS
-- =========================================================
alter table public.orders
add column if not exists payment_status text not null default 'unpaid';

alter table public.orders
add column if not exists paid_at timestamptz;

alter table public.orders
add column if not exists payment_method text;

alter table public.orders
add column if not exists payment_reference text;

alter table public.orders
drop constraint if exists orders_payment_status_check;

alter table public.orders
add constraint orders_payment_status_check check (
  payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')
);

-- Backfill existing rows
update public.orders
set payment_status = 'paid',
    paid_at = coalesce(paid_at, updated_at, created_at),
    payment_method = coalesce(payment_method, 'legacy'),
    payment_reference = coalesce(payment_reference, 'LEGACY-' || substring(id::text from 1 for 8))
where status in ('paid', 'preparing_shipment', 'shipped', 'delivered')
  and payment_status = 'unpaid';

update public.orders
set payment_status = 'unpaid'
where payment_status is null;

-- =========================================================
-- SYNC NEW ORDERS WITH payment_status
-- =========================================================
create or replace function public.sync_auction_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.orders (
    listing_id,
    seller_id,
    buyer_id,
    final_price,
    status,
    payment_status
  )
  select
    l.id,
    l.seller_id,
    winner.bidder_id,
    l.current_price,
    'awaiting_payment',
    'unpaid'
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

-- =========================================================
-- ORDER UPDATE VALIDATION (seller fulfillment + payment lock)
-- =========================================================
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

  if new.payment_status is distinct from old.payment_status
    or new.paid_at is distinct from old.paid_at
    or new.payment_method is distinct from old.payment_method
    or new.payment_reference is distinct from old.payment_reference
  then
    raise exception 'Payment fields cannot be updated directly';
  end if;

  if new.status is distinct from old.status then
    if old.payment_status <> 'paid'
      and new.status in ('preparing_shipment', 'shipped', 'delivered')
    then
      raise exception 'Awaiting buyer payment before fulfillment';
    end if;

    if new.status = 'paid' and old.payment_status <> 'paid' then
      raise exception 'Use checkout to confirm payment';
    end if;
  end if;

  return new;
end;
$$;

-- =========================================================
-- MOCK PAYMENT (buyer only, security definer)
-- =========================================================
create or replace function public.pay_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_ref text;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.buyer_id <> auth.uid() then
    raise exception 'Only the winning buyer can pay for this order';
  end if;

  if v_order.payment_status = 'paid' then
    raise exception 'This order has already been paid';
  end if;

  if v_order.payment_status not in ('unpaid', 'pending') then
    raise exception 'Order cannot be paid in its current payment state';
  end if;

  if v_order.status not in ('awaiting_payment', 'paid') then
    raise exception 'Order is not awaiting payment';
  end if;

  v_ref :=
    'GBM-'
    || upper(substring(replace(p_order_id::text, '-', '') from 1 for 8))
    || '-'
    || to_char(now() at time zone 'utc', 'YYYYMMDDHH24MISS');

  update public.orders
  set
    payment_status = 'paid',
    status = 'paid',
    paid_at = now(),
    payment_method = 'mock',
    payment_reference = v_ref,
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.pay_order(uuid) from public;
grant execute on function public.pay_order(uuid) to authenticated;

-- =========================================================
-- ADMIN: VIEW ALL ORDERS (payment info)
-- =========================================================
drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
on public.orders
for select
to authenticated
using (public.is_admin());

-- =========================================================
-- REVIEWS: require paid + delivered order
-- =========================================================
create or replace function public.validate_review_insert()
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
  v_order_payment_status text;
  v_order_status text;
begin
  select seller_id, status, auction_end, reserve_price, current_price
    into v_seller_id, v_status, v_auction_end, v_reserve_price, v_current_price
  from public.listings
  where id = new.listing_id;

  if v_seller_id is null then
    raise exception 'Listing not found';
  end if;

  if new.reviewer_id = v_seller_id then
    raise exception 'Seller cannot review themselves';
  end if;

  if new.seller_id <> v_seller_id then
    raise exception 'Invalid seller for this listing';
  end if;

  if v_status <> 'ended' and v_auction_end > now() then
    raise exception 'Auction must be ended before leaving a review';
  end if;

  if v_reserve_price is not null and v_current_price < v_reserve_price then
    raise exception 'Reserve not met — review not allowed';
  end if;

  select bidder_id
    into v_winner_id
  from public.bids
  where listing_id = new.listing_id
  order by amount desc, created_at desc
  limit 1;

  if v_winner_id is null or v_winner_id <> new.reviewer_id then
    raise exception 'Only the winning bidder can leave a review';
  end if;

  select o.payment_status, o.status
    into v_order_payment_status, v_order_status
  from public.orders o
  where o.listing_id = new.listing_id
    and o.buyer_id = new.reviewer_id;

  if v_order_payment_status is null then
    raise exception 'Order required before leaving a review';
  end if;

  if v_order_payment_status <> 'paid' then
    raise exception 'Payment must be completed before leaving a review';
  end if;

  if v_order_status <> 'delivered' then
    raise exception 'Order must be delivered before leaving a review';
  end if;

  return new;
end;
$$;
