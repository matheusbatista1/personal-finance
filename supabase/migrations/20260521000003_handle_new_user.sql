-- =============================================================================
-- Bootstrap a new user on signup: create profile + default "Outros" wallet.
-- Runs as security definer so it can write to public schema regardless of RLS.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
    values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  insert into public.wallets (user_id, name, is_default, account_type, balance_cents)
    values (new.id, 'Outros', true, 'PF', 0);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
