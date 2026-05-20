-- Seller can update and delete their own listings (run if not already applied in Supabase)

drop policy if exists "Sellers can update own listings" on public.listings;
create policy "Sellers can update own listings"
on public.listings
for update
to authenticated
using (auth.uid() = seller_id)
with check (auth.uid() = seller_id);

drop policy if exists "Sellers can delete own listings" on public.listings;
create policy "Sellers can delete own listings"
on public.listings
for delete
to authenticated
using (auth.uid() = seller_id);
