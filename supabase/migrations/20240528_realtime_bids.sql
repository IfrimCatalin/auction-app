-- GoBidMe: enable Supabase Realtime for live bids and listing price updates

alter publication supabase_realtime add table public.bids;
alter publication supabase_realtime add table public.listings;
