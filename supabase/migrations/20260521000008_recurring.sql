-- Recurring transactions: a transaction can repeat every month indefinitely. We
-- materialize instances lazily — each month rendered for the user clones the
-- template forward until the current month. Instances share recurrence_group_id.

create type recurrence_kind as enum ('none', 'monthly');

alter table public.transactions
  add column if not exists recurrence recurrence_kind not null default 'none';

alter table public.transactions
  add column if not exists recurrence_group_id uuid;

create index if not exists transactions_recurrence_idx
  on public.transactions(user_id, recurrence_group_id)
  where recurrence_group_id is not null;
