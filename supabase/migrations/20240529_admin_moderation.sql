-- GoBidMe: admin moderation (run in Supabase SQL Editor before /admin)
-- Bootstrap: insert into public.admin_users (user_id) values ('<your-auth-user-uuid>');

-- =========================================================
-- ADMIN USERS
-- =========================================================
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

drop policy if exists "Users can verify own admin status" on public.admin_users;
create policy "Users can verify own admin status"
on public.admin_users
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view admin roster" on public.admin_users;
create policy "Admins can view admin roster"
on public.admin_users
for select
to authenticated
using (public.is_admin());

-- =========================================================
-- LISTING MODERATION FIELDS
-- =========================================================
alter table public.listings
add column if not exists is_hidden boolean not null default false;

create index if not exists listings_is_hidden_idx
  on public.listings (is_hidden)
  where is_hidden = true;

-- =========================================================
-- PUBLIC LISTING VISIBILITY (RLS)
-- =========================================================
drop policy if exists "Listings are viewable by everyone" on public.listings;
drop policy if exists "Anyone can view listings" on public.listings;
drop policy if exists "Public listings are viewable" on public.listings;
drop policy if exists "Public can view marketplace listings" on public.listings;

create policy "Public can view marketplace listings"
on public.listings
for select
using (
  (
    coalesce(is_hidden, false) = false
    and status is distinct from 'cancelled'
  )
  or seller_id = auth.uid()
  or public.is_admin()
);

-- =========================================================
-- ADMIN MODERATION RPCs (security definer)
-- =========================================================
create or replace function public.admin_cancel_listing(p_listing_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: admin only';
  end if;

  update public.listings
  set status = 'cancelled'
  where id = p_listing_id;

  if not found then
    raise exception 'Listing not found';
  end if;
end;
$$;

create or replace function public.admin_set_listing_hidden(
  p_listing_id uuid,
  p_hidden boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: admin only';
  end if;

  update public.listings
  set is_hidden = coalesce(p_hidden, false)
  where id = p_listing_id;

  if not found then
    raise exception 'Listing not found';
  end if;
end;
$$;

revoke all on function public.admin_cancel_listing(uuid) from public;
grant execute on function public.admin_cancel_listing(uuid) to authenticated;

revoke all on function public.admin_set_listing_hidden(uuid, boolean) from public;
grant execute on function public.admin_set_listing_hidden(uuid, boolean) to authenticated;

-- =========================================================
-- BIDS: preserve public bid history + admin dashboard access
-- =========================================================
alter table public.bids enable row level security;

drop policy if exists "Bids are viewable by everyone" on public.bids;
create policy "Bids are viewable by everyone"
on public.bids
for select
using (true);

drop policy if exists "Admins can view all bids" on public.bids;
create policy "Admins can view all bids"
on public.bids
for select
to authenticated
using (public.is_admin());

-- =========================================================
-- BLOCK BIDS ON HIDDEN LISTINGS
-- =========================================================
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
  v_is_hidden boolean;
  v_increment numeric(12,2);
  v_minimum_bid numeric(12,2);
begin
  select current_price, status, auction_end, is_hidden
    into v_current_price, v_status, v_auction_end, v_is_hidden
  from public.listings
  where id = new.listing_id
  for update;

  if not found then
    raise exception 'Listing does not exist';
  end if;

  if coalesce(v_is_hidden, false) then
    raise exception 'Cannot bid: listing is not available';
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
