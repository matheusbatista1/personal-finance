-- =============================================================================
-- Row Level Security — every table with user data is gated by auth.uid().
-- Banks are shared-readable; categories are mixed (system rows where
-- user_id IS NULL are readable by everyone, writes only by the owner).
-- =============================================================================

-- ---------- profiles ----------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Inserts are handled by the handle_new_user trigger (runs as security definer).

-- ---------- banks ----------
alter table public.banks enable row level security;

create policy "banks_select_all" on public.banks
  for select using (true);
-- No insert/update/delete policies — only service role can mutate.

-- ---------- contacts ----------
alter table public.contacts enable row level security;

create policy "contacts_select_own" on public.contacts
  for select using (auth.uid() = user_id);

create policy "contacts_insert_own" on public.contacts
  for insert with check (auth.uid() = user_id);

create policy "contacts_update_own" on public.contacts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "contacts_delete_own" on public.contacts
  for delete using (auth.uid() = user_id);

-- ---------- categories ----------
alter table public.categories enable row level security;

create policy "categories_select_own_or_system" on public.categories
  for select using (auth.uid() = user_id or user_id is null);

create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id);

-- ---------- wallets ----------
alter table public.wallets enable row level security;

create policy "wallets_select_own" on public.wallets
  for select using (auth.uid() = user_id);

create policy "wallets_insert_own" on public.wallets
  for insert with check (auth.uid() = user_id);

create policy "wallets_update_own" on public.wallets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wallets_delete_own" on public.wallets
  for delete using (auth.uid() = user_id and is_default = false);

-- ---------- cards ----------
alter table public.cards enable row level security;

create policy "cards_select_own" on public.cards
  for select using (auth.uid() = user_id);

create policy "cards_insert_own" on public.cards
  for insert with check (auth.uid() = user_id);

create policy "cards_update_own" on public.cards
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cards_delete_own" on public.cards
  for delete using (auth.uid() = user_id);

-- ---------- invoices ----------
alter table public.invoices enable row level security;

create policy "invoices_select_own" on public.invoices
  for select using (auth.uid() = user_id);

create policy "invoices_insert_own" on public.invoices
  for insert with check (auth.uid() = user_id);

create policy "invoices_update_own" on public.invoices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "invoices_delete_own" on public.invoices
  for delete using (auth.uid() = user_id);

-- ---------- transactions ----------
alter table public.transactions enable row level security;

create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);

create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);

create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

-- ---------- transaction_splits ----------
alter table public.transaction_splits enable row level security;

create policy "transaction_splits_select_own" on public.transaction_splits
  for select using (auth.uid() = user_id);

create policy "transaction_splits_insert_own" on public.transaction_splits
  for insert with check (auth.uid() = user_id);

create policy "transaction_splits_update_own" on public.transaction_splits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transaction_splits_delete_own" on public.transaction_splits
  for delete using (auth.uid() = user_id);
