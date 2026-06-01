-- GoBidMe: buyer/seller messaging (run in Supabase SQL Editor before /messages)
-- Requires: public.listings, public.orders, auth.users

-- =========================================================
-- CONVERSATIONS
-- =========================================================
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint conversations_buyer_not_seller check (buyer_id <> seller_id),
  constraint conversations_one_per_buyer_listing unique (listing_id, buyer_id)
);

create index if not exists conversations_buyer_id_last_message_idx
  on public.conversations (buyer_id, last_message_at desc nulls last);

create index if not exists conversations_seller_id_last_message_idx
  on public.conversations (seller_id, last_message_at desc nulls last);

create index if not exists conversations_listing_id_idx
  on public.conversations (listing_id);

alter table public.conversations enable row level security;

-- =========================================================
-- MESSAGES
-- =========================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint messages_content_length check (
    char_length(trim(content)) >= 1 and char_length(content) <= 4000
  )
);

create index if not exists messages_conversation_id_created_at_idx
  on public.messages (conversation_id, created_at asc);

create index if not exists messages_conversation_unread_idx
  on public.messages (conversation_id)
  where read_at is null;

alter table public.messages enable row level security;

-- =========================================================
-- HELPERS
-- =========================================================
create or replace function public.is_conversation_participant(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversations c
    where c.id = p_conversation_id
      and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
  );
$$;

revoke all on function public.is_conversation_participant(uuid) from public;
grant execute on function public.is_conversation_participant(uuid) to authenticated;

-- =========================================================
-- CONVERSATION TIMESTAMPS
-- =========================================================
create or replace function public.set_conversations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_conversations_updated_at on public.conversations;
create trigger trg_conversations_updated_at
before update on public.conversations
for each row execute function public.set_conversations_updated_at();

create or replace function public.on_message_insert_update_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_message_at = new.created_at,
    updated_at = now()
  where id = new.conversation_id;

  return new;
end;
$$;

drop trigger if exists trg_message_insert_update_conversation on public.messages;
create trigger trg_message_insert_update_conversation
after insert on public.messages
for each row execute function public.on_message_insert_update_conversation();

-- =========================================================
-- VALIDATE MESSAGE INSERT
-- =========================================================
create or replace function public.validate_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
begin
  if new.sender_id <> auth.uid() then
    raise exception 'Sender must be the signed-in user';
  end if;

  select buyer_id, seller_id
    into v_buyer_id, v_seller_id
  from public.conversations
  where id = new.conversation_id;

  if v_buyer_id is null then
    raise exception 'Conversation not found';
  end if;

  if auth.uid() <> v_buyer_id and auth.uid() <> v_seller_id then
    raise exception 'Forbidden: not a conversation participant';
  end if;

  if new.sender_id <> v_buyer_id and new.sender_id <> v_seller_id then
    raise exception 'Invalid sender for this conversation';
  end if;

  new.content := trim(new.content);

  if char_length(new.content) < 1 then
    raise exception 'Message cannot be empty';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_message_insert on public.messages;
create trigger trg_validate_message_insert
before insert on public.messages
for each row execute function public.validate_message_insert();

-- =========================================================
-- GET OR CREATE CONVERSATION (security definer)
-- =========================================================
create or replace function public.get_or_create_conversation(
  p_listing_id uuid,
  p_buyer_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller_id uuid;
  v_buyer_id uuid;
  v_conversation_id uuid;
  v_order_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in required';
  end if;

  select seller_id
    into v_seller_id
  from public.listings
  where id = p_listing_id;

  if v_seller_id is null then
    raise exception 'Listing not found';
  end if;

  if auth.uid() = v_seller_id then
    if p_buyer_id is null then
      raise exception 'Seller must specify the buyer';
    end if;
    v_buyer_id := p_buyer_id;

    select o.id
      into v_order_id
    from public.orders o
    where o.listing_id = p_listing_id
      and o.seller_id = v_seller_id
      and o.buyer_id = v_buyer_id
    limit 1;

    if v_order_id is null then
      raise exception 'No order exists between this buyer and listing';
    end if;
  else
    v_buyer_id := auth.uid();

    if p_buyer_id is not null and p_buyer_id <> v_buyer_id then
      raise exception 'Forbidden';
    end if;

    if v_buyer_id = v_seller_id then
      raise exception 'You cannot message yourself';
    end if;

    select o.id
      into v_order_id
    from public.orders o
    where o.listing_id = p_listing_id
      and o.buyer_id = v_buyer_id
    limit 1;
  end if;

  select id
    into v_conversation_id
  from public.conversations
  where listing_id = p_listing_id
    and buyer_id = v_buyer_id;

  if v_conversation_id is not null then
    if v_order_id is not null then
      update public.conversations
      set order_id = coalesce(order_id, v_order_id)
      where id = v_conversation_id
        and order_id is null;
    end if;

    return v_conversation_id;
  end if;

  insert into public.conversations (listing_id, order_id, buyer_id, seller_id)
  values (p_listing_id, v_order_id, v_buyer_id, v_seller_id)
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_conversation(uuid, uuid) from public;
grant execute on function public.get_or_create_conversation(uuid, uuid) to authenticated;

-- =========================================================
-- MARK MESSAGES READ
-- =========================================================
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if not public.is_conversation_participant(p_conversation_id) then
    raise exception 'Forbidden: not a conversation participant';
  end if;

  update public.messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and read_at is null;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

-- =========================================================
-- RLS: CONVERSATIONS
-- =========================================================
drop policy if exists "Participants can view conversations" on public.conversations;
create policy "Participants can view conversations"
on public.conversations
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Inserts go through get_or_create_conversation (security definer)

-- =========================================================
-- RLS: MESSAGES
-- =========================================================
drop policy if exists "Participants can view messages" on public.messages;
create policy "Participants can view messages"
on public.messages
for select
to authenticated
using (public.is_conversation_participant(conversation_id));

drop policy if exists "Participants can send messages" on public.messages;
create policy "Participants can send messages"
on public.messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and public.is_conversation_participant(conversation_id)
);

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
on public.messages
for update
to authenticated
using (
  public.is_conversation_participant(conversation_id)
  and sender_id <> auth.uid()
)
with check (
  public.is_conversation_participant(conversation_id)
  and sender_id <> auth.uid()
);

-- =========================================================
-- REALTIME
-- =========================================================
alter publication supabase_realtime add table public.messages;
