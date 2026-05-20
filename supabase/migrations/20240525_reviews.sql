-- GoBidMe: seller reviews (winning bidder only, after ended auction)

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  constraint reviews_one_per_listing_per_reviewer unique (listing_id, reviewer_id)
);

create index if not exists reviews_seller_id_created_at_idx
  on public.reviews (seller_id, created_at desc);

create index if not exists reviews_listing_id_idx
  on public.reviews (listing_id);

alter table public.reviews enable row level security;

drop policy if exists "Reviews are viewable by everyone" on public.reviews;
create policy "Reviews are viewable by everyone"
on public.reviews
for select
using (true);

drop policy if exists "Winners can insert own reviews" on public.reviews;
create policy "Winners can insert own reviews"
on public.reviews
for insert
to authenticated
with check (
  auth.uid() = reviewer_id
  and reviewer_id <> seller_id
);

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

  return new;
end;
$$;

drop trigger if exists trg_validate_review_insert on public.reviews;
create trigger trg_validate_review_insert
before insert on public.reviews
for each row execute function public.validate_review_insert();
