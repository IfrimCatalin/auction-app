-- GoBidMe: enforce minimum bid increment of $5 above current price
-- Run in Supabase SQL Editor if not using migration tooling.

create or replace function public.validate_and_apply_bid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_price numeric(12,2);
  v_status text;
  v_auction_end timestamptz;
  v_minimum_bid numeric(12,2);
begin
  select current_price, status, auction_end
    into v_current_price, v_status, v_auction_end
  from public.listings
  where id = new.listing_id
  for update;

  if not found then
    raise exception 'Listing does not exist';
  end if;

  if v_status <> 'active' then
    raise exception 'Cannot bid: listing is not active';
  end if;

  if v_auction_end <= now() then
    raise exception 'Cannot bid: auction has ended';
  end if;

  v_minimum_bid := v_current_price + 5;

  if new.amount < v_minimum_bid then
    raise exception
      'Bid must be at least current price plus $5 increment (minimum bid: %)',
      v_minimum_bid;
  end if;

  update public.listings
  set current_price = new.amount
  where id = new.listing_id;

  return new;
end;
$$;
