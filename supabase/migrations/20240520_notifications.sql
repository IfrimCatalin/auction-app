-- GoBidMe: notifications / activity feed

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (char_length(type) > 0 and char_length(type) <= 50),
  title text not null check (char_length(title) > 0 and char_length(title) <= 120),
  message text not null check (char_length(message) > 0 and char_length(message) <= 1000),
  listing_id uuid references public.listings(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_read_idx
  on public.notifications (user_id, read_at);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
on public.notifications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.create_bid_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_seller_id uuid;
  listing_title text;
  outbid_user_id uuid;
begin
  select seller_id, title
  into listing_seller_id, listing_title
  from public.listings
  where id = new.listing_id;

  if listing_seller_id is null then
    return new;
  end if;

  if listing_seller_id <> new.bidder_id then
    insert into public.notifications (user_id, type, title, message, listing_id)
    values (
      listing_seller_id,
      'new_bid',
      'New bid on your listing',
      format('You received a new bid on "%s".', coalesce(listing_title, 'your listing')),
      new.listing_id
    );
  end if;

  select bidder_id
  into outbid_user_id
  from public.bids
  where listing_id = new.listing_id
    and bidder_id <> new.bidder_id
  order by amount desc, created_at desc
  limit 1;

  if outbid_user_id is not null then
    insert into public.notifications (user_id, type, title, message, listing_id)
    values (
      outbid_user_id,
      'outbid',
      'You were outbid',
      format('Another bidder placed a higher bid on "%s".', coalesce(listing_title, 'a listing')),
      new.listing_id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_create_bid_notifications on public.bids;
create trigger trg_create_bid_notifications
after insert on public.bids
for each row execute function public.create_bid_notifications();
