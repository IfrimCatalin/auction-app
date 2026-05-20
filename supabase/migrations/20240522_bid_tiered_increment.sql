-- GoBidMe: tiered minimum bid increments (must match lib/bids.ts)
-- Run in Supabase SQL Editor if not using migration tooling.

create or replace function public.get_bid_increment(p_current_price numeric)
returns numeric
language plpgsql
immutable
as $$
begin
  if p_current_price < 100 then
    return 5;
  elsif p_current_price < 500 then
    return 10;
  elsif p_current_price < 1000 then
    return 25;
  elsif p_current_price < 5000 then
    return 50;
  else
    return 100;
  end if;
end;
$$;

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
  v_increment numeric(12,2);
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

  v_increment := public.get_bid_increment(v_current_price);
  v_minimum_bid := v_current_price + v_increment;

  if new.amount < v_minimum_bid then
    raise exception
      'Bid must meet the tiered minimum increment (minimum bid: %, increment: %)',
      v_minimum_bid,
      v_increment;
  end if;

  update public.listings
  set current_price = new.amount
  where id = new.listing_id;

  return new;
end;
$$;
