-- =============================================================================
-- Seed: banks lookup + system categories. Idempotent via ON CONFLICT.
-- Runs as superuser (db:reset) so RLS does not apply.
-- =============================================================================

-- ---------- Banks ----------
insert into public.banks (name, short_name, icon_emoji, brand_color) values
  ('Nubank', 'NU', '💜', '#820AD1'),
  ('Itaú Unibanco', 'ITAU', '🟧', '#EC7000'),
  ('Itaú Personnalité', 'ITAU_PP', '🟧', '#0033A0'),
  ('Banco do Brasil', 'BB', '🟨', '#FFEF38'),
  ('Bradesco', 'BRADESCO', '🟥', '#CC092F'),
  ('Caixa Econômica Federal', 'CAIXA', '🟦', '#0070AF'),
  ('Santander', 'SANTANDER', '🟥', '#EC0000'),
  ('Inter', 'INTER', '🟧', '#FF7A00'),
  ('C6 Bank', 'C6', '⬛', '#242424'),
  ('BTG Pactual', 'BTG', '⬛', '#003366'),
  ('XP Investimentos', 'XP', '⬛', '#000000'),
  ('Original', 'ORIGINAL', '🟩', '#00875F'),
  ('Next', 'NEXT', '🟩', '#00FF5F'),
  ('PicPay', 'PICPAY', '🟩', '#11C76F'),
  ('Mercado Pago', 'MERCADOPAGO', '🟦', '#009EE3'),
  ('Sicoob', 'SICOOB', '🟩', '#003641'),
  ('Sicredi', 'SICREDI', '🟩', '#3FA535'),
  ('Banco Pan', 'PAN', '🟦', '#0066CC'),
  ('Neon', 'NEON', '🟩', '#00E676'),
  ('Will Bank', 'WILL', '🟧', '#FF6B00'),
  ('Outros', 'OUTROS', '🔹', '#988CA0')
on conflict (name) do nothing;

-- ---------- System categories (user_id IS NULL) ----------
insert into public.categories (user_id, name, icon_name, color) values
  (null, 'Transporte', 'Car', '#ffb873'),
  (null, 'Alimentação', 'Utensils', '#dcb8ff'),
  (null, 'Pet', 'PawPrint', '#d2bbff'),
  (null, 'Compras', 'ShoppingBag', '#ffb873'),
  (null, 'Mimo', 'Gift', '#dcb8ff'),
  (null, 'Saúde', 'HeartPulse', '#ffb4ab'),
  (null, 'Viagem', 'Plane', '#dcb8ff'),
  (null, 'Pessoal', 'User', '#cfc2d7'),
  (null, 'Moradia', 'Home', '#ffb873'),
  (null, 'Verificar', 'AlertCircle', '#ffb4ab'),
  (null, 'Assinatura', 'Repeat', '#d2bbff'),
  (null, 'Profissional', 'Briefcase', '#cfc2d7'),
  (null, 'Educação', 'GraduationCap', '#dcb8ff')
on conflict do nothing;
