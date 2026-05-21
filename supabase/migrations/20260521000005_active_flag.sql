-- Soft-disable for wallets, cards, categories so users can hide items without losing
-- history. System categories (user_id IS NULL) are shared, so we use a per-user
-- override table to let each user hide them individually.

alter table public.wallets
  add column if not exists is_active boolean not null default true;

alter table public.cards
  add column if not exists is_active boolean not null default true;

alter table public.categories
  add column if not exists is_active boolean not null default true;

create index if not exists wallets_is_active_idx on public.wallets(user_id, is_active);
create index if not exists cards_is_active_idx on public.cards(user_id, is_active);
create index if not exists categories_is_active_idx
  on public.categories(coalesce(user_id, '00000000-0000-0000-0000-000000000000'::uuid), is_active);

-- Per-user hidden system categories. Only used for rows where categories.user_id IS NULL.
create table if not exists public.user_category_overrides (
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, category_id)
);

alter table public.user_category_overrides enable row level security;

drop policy if exists "user_category_overrides_select_own" on public.user_category_overrides;
drop policy if exists "user_category_overrides_insert_own" on public.user_category_overrides;
drop policy if exists "user_category_overrides_update_own" on public.user_category_overrides;
drop policy if exists "user_category_overrides_delete_own" on public.user_category_overrides;

create policy "user_category_overrides_select_own" on public.user_category_overrides
  for select using (auth.uid() = user_id);

create policy "user_category_overrides_insert_own" on public.user_category_overrides
  for insert with check (auth.uid() = user_id);

create policy "user_category_overrides_update_own" on public.user_category_overrides
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_category_overrides_delete_own" on public.user_category_overrides
  for delete using (auth.uid() = user_id);
