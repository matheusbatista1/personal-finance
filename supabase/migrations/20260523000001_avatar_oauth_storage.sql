-- Extend handle_new_user to also capture name/avatar from OAuth providers
-- (Google sends `name`/`full_name`/`avatar_url`/`picture` in raw_user_meta_data),
-- backfill existing profiles, and set up a public `avatars` storage bucket.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
    values (
      new.id,
      coalesce(
        new.raw_user_meta_data->>'display_name',
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'full_name',
        split_part(new.email, '@', 1)
      ),
      coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
      )
    )
  on conflict (id) do update
    set
      display_name = coalesce(profiles.display_name, excluded.display_name),
      avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url);

  insert into public.wallets (user_id, name, is_default, account_type, balance_cents)
    values (new.id, 'Outros', true, 'PF', 0)
  on conflict do nothing;

  return new;
end $$;

-- One-shot backfill: copy avatar/name from existing OAuth users into profiles.
update public.profiles p
set
  avatar_url = coalesce(
    p.avatar_url,
    u.raw_user_meta_data->>'avatar_url',
    u.raw_user_meta_data->>'picture'
  ),
  display_name = coalesce(
    p.display_name,
    u.raw_user_meta_data->>'name',
    u.raw_user_meta_data->>'full_name',
    split_part(u.email, '@', 1)
  )
from auth.users u
where u.id = p.id;

-- Avatars storage bucket (public-readable, owner-writable).
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "avatars public read" on storage.objects;
drop policy if exists "avatars owner insert" on storage.objects;
drop policy if exists "avatars owner update" on storage.objects;
drop policy if exists "avatars owner delete" on storage.objects;

create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars owner insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars owner delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );
