-- GoBidMe: mark past-due active listings as ended (no cron; called from app on page load)

create or replace function public.expire_past_due_listings()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.listings
  set status = 'ended'
  where status = 'active'
    and auction_end <= now();

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.expire_past_due_listings() from public;
grant execute on function public.expire_past_due_listings() to anon, authenticated;
