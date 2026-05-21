-- =============================================================================
-- Initial schema for personal-finance
-- =============================================================================
-- Enums, tables, indexes, and CHECK constraints for the full domain model
-- described in CLAUDE.md. RLS and triggers live in subsequent migrations so
-- the schema definition stays readable on its own.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------- Enums ----------
create type transaction_type as enum ('income', 'expense');
create type account_type as enum ('PF', 'PJ');
create type operation_type as enum ('card', 'loan', 'pix');
create type split_mode as enum ('none', 'equal', 'custom');

-- ---------- updated_at helper ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- banks (system lookup, shared) ----------
create table public.banks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text not null unique,
  icon_emoji text,
  brand_color text,
  created_at timestamptz not null default now()
);

-- ---------- contacts (people for rateio) ----------
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contacts_user_id_idx on public.contacts(user_id);
create trigger contacts_set_updated_at
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- ---------- categories (system + user) ----------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  icon_name text,
  color text,
  created_at timestamptz not null default now()
);
create index categories_user_id_idx on public.categories(user_id);
-- Case-insensitive unique name per user (or globally for system rows where user_id is null)
create unique index categories_unique_name_per_user_idx
  on public.categories(coalesce(user_id::text, 'system'), lower(name));

-- ---------- wallets (contas bancárias) ----------
create table public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank_id uuid references public.banks(id) on delete set null,
  name text not null,
  account_type account_type not null default 'PF',
  balance_cents bigint not null default 0,
  invested_cents bigint not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index wallets_user_id_idx on public.wallets(user_id);
create unique index wallets_one_default_per_user_idx
  on public.wallets(user_id) where is_default = true;
create trigger wallets_set_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

-- ---------- cards (cartões de crédito) ----------
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid not null references public.wallets(id) on delete restrict,
  name text not null,
  credit_limit_cents bigint not null default 0,
  color text not null default '#8a2be2',
  due_day smallint not null check (due_day between 1 and 31),
  closing_day smallint not null check (closing_day between 1 and 31),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cards_user_id_idx on public.cards(user_id);
create index cards_wallet_id_idx on public.cards(wallet_id);
create trigger cards_set_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

-- ---------- invoices (faturas) ----------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  reference_year smallint not null,
  reference_month smallint not null check (reference_month between 1 and 12),
  closing_date date,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, reference_year, reference_month)
);
create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_card_id_idx on public.invoices(card_id);
create index invoices_period_idx on public.invoices(reference_year, reference_month);
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ---------- transactions ----------
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_id uuid references public.wallets(id) on delete restrict,
  card_id uuid references public.cards(id) on delete restrict,
  invoice_id uuid references public.invoices(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  amount_cents bigint not null,
  description text not null default '',
  occurred_at timestamptz not null default now(),
  type transaction_type not null,
  split_mode split_mode not null default 'none',
  user_included_in_split boolean not null default true,
  user_share_cents bigint not null default 0,
  operation operation_type,
  installment_number smallint not null default 1 check (installment_number >= 1),
  installment_total smallint not null default 1 check (installment_total >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_installment_within_total check (installment_number <= installment_total),
  constraint transactions_exactly_one_source check (
    (wallet_id is not null and card_id is null)
    or (wallet_id is null and card_id is not null)
  )
);
create index transactions_user_id_idx on public.transactions(user_id);
create index transactions_wallet_id_idx on public.transactions(wallet_id);
create index transactions_card_id_idx on public.transactions(card_id);
create index transactions_invoice_id_idx on public.transactions(invoice_id);
create index transactions_category_id_idx on public.transactions(category_id);
create index transactions_occurred_at_idx on public.transactions(occurred_at desc);
create index transactions_user_occurred_at_idx on public.transactions(user_id, occurred_at desc);
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------- transaction_splits (rateio) ----------
create table public.transaction_splits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete restrict,
  amount_cents bigint not null,
  created_at timestamptz not null default now(),
  unique (transaction_id, contact_id)
);
create index transaction_splits_user_id_idx on public.transaction_splits(user_id);
create index transaction_splits_transaction_id_idx on public.transaction_splits(transaction_id);
create index transaction_splits_contact_id_idx on public.transaction_splits(contact_id);
