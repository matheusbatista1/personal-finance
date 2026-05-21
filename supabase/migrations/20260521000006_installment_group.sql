-- Link transactions that belong to the same parceled purchase so we can delete all
-- installments at once when the user asks. NULL for non-installment transactions.

alter table public.transactions
  add column if not exists installment_group_id uuid;

create index if not exists transactions_installment_group_idx
  on public.transactions(user_id, installment_group_id)
  where installment_group_id is not null;
