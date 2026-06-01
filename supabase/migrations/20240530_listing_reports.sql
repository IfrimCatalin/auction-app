-- GoBidMe: listing reports (run in Supabase SQL Editor before report UI)
-- Requires: public.listings, public.is_admin() from admin moderation migration

-- =========================================================
-- LISTING REPORTS TABLE
-- =========================================================
create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint listing_reports_one_per_user unique (listing_id, reporter_id),
  constraint listing_reports_reason_check check (
    reason in (
      'scam',
      'counterfeit',
      'inappropriate',
      'wrong_category',
      'suspicious_seller',
      'other'
    )
  ),
  constraint listing_reports_status_check check (
    status in ('pending', 'reviewed', 'resolved')
  ),
  constraint listing_reports_message_length check (
    message is null or char_length(trim(message)) <= 1000
  )
);

create index if not exists listing_reports_listing_id_created_at_idx
  on public.listing_reports (listing_id, created_at desc);

create index if not exists listing_reports_status_created_at_idx
  on public.listing_reports (status, created_at desc);

alter table public.listing_reports enable row level security;

-- =========================================================
-- VALIDATION TRIGGER
-- =========================================================
create or replace function public.validate_listing_report_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
begin
  if new.reporter_id <> auth.uid() then
    raise exception 'Reporter must match signed-in user';
  end if;

  select seller_id
    into v_seller_id
  from public.listings
  where id = new.listing_id;

  if v_seller_id is null then
    raise exception 'Listing not found';
  end if;

  if v_seller_id = new.reporter_id then
    raise exception 'You cannot report your own listing';
  end if;

  if new.message is not null and char_length(trim(new.message)) = 0 then
    new.message := null;
  end if;

  new.status := 'pending';
  new.updated_at := now();
  new.reviewed_at := null;

  return new;
end;
$$;

drop trigger if exists trg_validate_listing_report_insert on public.listing_reports;
create trigger trg_validate_listing_report_insert
before insert on public.listing_reports
for each row execute function public.validate_listing_report_insert();

create or replace function public.set_listing_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listing_reports_updated_at on public.listing_reports;
create trigger trg_listing_reports_updated_at
before update on public.listing_reports
for each row execute function public.set_listing_reports_updated_at();

-- =========================================================
-- RLS
-- =========================================================
drop policy if exists "Users can insert own listing reports" on public.listing_reports;
create policy "Users can insert own listing reports"
on public.listing_reports
for insert
to authenticated
with check (auth.uid() = reporter_id);

drop policy if exists "Users can view own listing reports" on public.listing_reports;
create policy "Users can view own listing reports"
on public.listing_reports
for select
to authenticated
using (auth.uid() = reporter_id);

drop policy if exists "Admins can view all listing reports" on public.listing_reports;
create policy "Admins can view all listing reports"
on public.listing_reports
for select
to authenticated
using (public.is_admin());

-- =========================================================
-- ADMIN: mark report reviewed / resolved
-- =========================================================
create or replace function public.admin_set_listing_report_status(
  p_report_id uuid,
  p_status text
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

  if p_status not in ('reviewed', 'resolved') then
    raise exception 'Status must be reviewed or resolved';
  end if;

  update public.listing_reports
  set
    status = p_status,
    reviewed_at = now(),
    updated_at = now()
  where id = p_report_id;

  if not found then
    raise exception 'Report not found';
  end if;
end;
$$;

revoke all on function public.admin_set_listing_report_status(uuid, text) from public;
grant execute on function public.admin_set_listing_report_status(uuid, text) to authenticated;
