-- GoBidMe: favorites / watchlist (run in Supabase SQL Editor before using /watchlist)

-- =========================================================
-- FAVORITES TABLE
-- =========================================================
create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists favorites_user_id_created_at_idx
  on public.favorites (user_id, created_at desc);

create index if not exists favorites_listing_id_idx
  on public.favorites (listing_id);

alter table public.favorites enable row level security;

-- Users can view their own favorites (watchlist)
drop policy if exists "Users can view own favorites" on public.favorites;
create policy "Users can view own favorites"
on public.favorites
for select
to authenticated
using (auth.uid() = user_id);

-- Users can add listings to their watchlist
drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
on public.favorites
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can remove listings from their watchlist
drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
on public.favorites
for delete
to authenticated
using (auth.uid() = user_id);
