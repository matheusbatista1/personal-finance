-- =============================================================================
-- Capture extra context on each rateio split:
--   * is_custom — whether the contact had a fixed (custom) amount entered by the
--     user or was part of the equal-split pool. Lets the edit form round-trip
--     without losing the original intent.
--   * settled_at — when the contact actually paid the user back. Drives the
--     "Total a Receber" view (pending = settled_at IS NULL).
-- =============================================================================

alter table public.transaction_splits
  add column if not exists is_custom boolean not null default false;

alter table public.transaction_splits
  add column if not exists settled_at timestamptz;

create index if not exists transaction_splits_settled_idx
  on public.transaction_splits(user_id, settled_at)
  where settled_at is null;
