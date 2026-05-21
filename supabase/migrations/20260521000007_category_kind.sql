-- Categorias agora têm "kind" para indicar se servem a despesas, receitas ou ambos.
-- Categorias do sistema permanecem "both" por padrão; usuário pode criar específicas.

create type category_kind as enum ('expense', 'income', 'both');

alter table public.categories
  add column if not exists kind category_kind not null default 'both';

create index if not exists categories_kind_idx on public.categories(kind);
