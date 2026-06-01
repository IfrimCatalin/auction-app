-- GoBidMe: shipping tracking and delivery confirmation (run before fulfillment UI)
-- Requires: public.orders, payment columns from 20240601_order_payments.sql

-- =========================================================
-- SHIPPING COLUMNS
-- =========================================================
alter table public.orders
add column if not exists tracking_number text;

alter table public.orders
add column if not exists shipping_carrier text;

alter table public.orders
add column if not exists shipped_at timestamptz;

alter table public.orders
add column if not exists delivered_at timestamptz;

alter table public.orders
drop constraint if exists orders_tracking_number_length;

alter table public.orders
add constraint orders_tracking_number_length check (
  tracking_number is null or char_length(trim(tracking_number)) between 3 and 100
);

alter table public.orders
drop constraint if exists orders_shipping_carrier_length;

alter table public.orders
add constraint orders_shipping_carrier_length check (
  shipping_carrier is null or char_length(trim(shipping_carrier)) between 2 and 80
);

-- =========================================================
-- BLOCK DIRECT STATUS / SHIPPING UPDATES (use RPCs)
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
    raise exception 'Order fields cannot be changed manually';
  end if;

  if new.payment_status is distinct from old.payment_status
    or new.paid_at is distinct from old.paid_at
    or new.payment_method is distinct from old.payment_method
    or new.payment_reference is distinct from old.payment_reference
  then
    raise exception 'Payment fields cannot be updated directly';
  end if;

  if new.status is distinct from old.status
    or new.tracking_number is distinct from old.tracking_number
    or new.shipping_carrier is distinct from old.shipping_carrier
    or new.shipped_at is distinct from old.shipped_at
    or new.delivered_at is distinct from old.delivered_at
  then
    raise exception 'Use order fulfillment actions to update status or shipping';
  end if;

  return new;
end;
$$;

-- =========================================================
-- SELLER: mark preparing shipment (paid -> preparing_shipment)
-- =========================================================
create or replace function public.seller_mark_preparing_shipment(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.seller_id <> auth.uid() then
    raise exception 'Only the seller can update this order';
  end if;

  if v_order.payment_status <> 'paid' then
    raise exception 'Payment must be completed before preparing shipment';
  end if;

  if v_order.status <> 'paid' then
    raise exception 'Order must be paid before preparing shipment';
  end if;

  update public.orders
  set status = 'preparing_shipment', updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- =========================================================
-- SELLER: mark shipped (requires tracking + carrier)
-- =========================================================
create or replace function public.seller_mark_shipped(
  p_order_id uuid,
  p_tracking_number text,
  p_shipping_carrier text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_tracking text;
  v_carrier text;
begin
  v_tracking := trim(coalesce(p_tracking_number, ''));
  v_carrier := trim(coalesce(p_shipping_carrier, ''));

  if char_length(v_tracking) < 3 then
    raise exception 'Tracking number is required';
  end if;

  if char_length(v_carrier) < 2 then
    raise exception 'Shipping carrier is required';
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.seller_id <> auth.uid() then
    raise exception 'Only the seller can update this order';
  end if;

  if v_order.payment_status <> 'paid' then
    raise exception 'Payment must be completed before shipping';
  end if;

  if v_order.status <> 'preparing_shipment' then
    raise exception 'Order must be preparing shipment before marking shipped';
  end if;

  update public.orders
  set
    status = 'shipped',
    tracking_number = v_tracking,
    shipping_carrier = v_carrier,
    shipped_at = now(),
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

-- =========================================================
-- BUYER: confirm delivery
-- =========================================================
create or replace function public.buyer_confirm_delivery(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.buyer_id <> auth.uid() then
    raise exception 'Only the buyer can confirm delivery';
  end if;

  if v_order.status <> 'shipped' then
    raise exception 'Order must be shipped before confirming delivery';
  end if;

  update public.orders
  set
    status = 'delivered',
    delivered_at = now(),
    updated_at = now()
  where id = p_order_id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.seller_mark_preparing_shipment(uuid) from public;
grant execute on function public.seller_mark_preparing_shipment(uuid) to authenticated;

revoke all on function public.seller_mark_shipped(uuid, text, text) from public;
grant execute on function public.seller_mark_shipped(uuid, text, text) to authenticated;

revoke all on function public.buyer_confirm_delivery(uuid) from public;
grant execute on function public.buyer_confirm_delivery(uuid) to authenticated;
