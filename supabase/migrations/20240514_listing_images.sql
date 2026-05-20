-- GoBidMe: multiple images per listing
-- Run this in the Supabase SQL Editor before using multi-image upload in the app.

-- =========================================================
-- LISTING IMAGES TABLE
-- =========================================================
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0 and sort_order < 8),
  created_at timestamptz not null default now(),
  unique (listing_id, sort_order)
);

create index if not exists listing_images_listing_id_idx
  on public.listing_images(listing_id);

create index if not exists listing_images_listing_sort_idx
  on public.listing_images(listing_id, sort_order);

alter table public.listing_images enable row level security;

-- Anyone can view listing images (public marketplace)
drop policy if exists "Listing images are viewable by everyone" on public.listing_images;
create policy "Listing images are viewable by everyone"
on public.listing_images
for select
using (true);

-- Listing owners can add images to their own listings
drop policy if exists "Sellers can insert images on own listings" on public.listing_images;
create policy "Sellers can insert images on own listings"
on public.listing_images
for insert
to authenticated
with check (
  exists (
    select 1
    from public.listings
    where listings.id = listing_id
      and listings.seller_id = auth.uid()
  )
);

-- Listing owners can remove images from their own listings
drop policy if exists "Sellers can delete images on own listings" on public.listing_images;
create policy "Sellers can delete images on own listings"
on public.listing_images
for delete
to authenticated
using (
  exists (
    select 1
    from public.listings
    where listings.id = listing_id
      and listings.seller_id = auth.uid()
  )
);

-- =========================================================
-- OPTIONAL: keep listings.image_url in sync with cover (sort_order = 0)
-- Helps legacy queries and migration from single image_url column.
-- =========================================================
create or replace function public.sync_listing_cover_from_images()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cover_url text;
begin
  select li.image_url
    into cover_url
  from public.listing_images li
  where li.listing_id = coalesce(NEW.listing_id, OLD.listing_id)
  order by li.sort_order asc
  limit 1;

  update public.listings
  set image_url = cover_url
  where id = coalesce(NEW.listing_id, OLD.listing_id);

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_sync_listing_cover_insert on public.listing_images;
create trigger trg_sync_listing_cover_insert
after insert on public.listing_images
for each row execute function public.sync_listing_cover_from_images();

drop trigger if exists trg_sync_listing_cover_delete on public.listing_images;
create trigger trg_sync_listing_cover_delete
after delete on public.listing_images
for each row execute function public.sync_listing_cover_from_images();

-- =========================================================
-- OPTIONAL: backfill listing_images from existing listings.image_url
-- =========================================================
-- insert into public.listing_images (listing_id, image_url, sort_order)
-- select id, image_url, 0
-- from public.listings
-- where image_url is not null
-- on conflict (listing_id, sort_order) do nothing;
