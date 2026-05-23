# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Communication language:** Always reply to the repo owner in **Portuguese (pt-BR)**. Code, identifiers, commit messages, branch names, PR titles/descriptions, and inline comments stay in **English** (see _Code style_ below).

---

## Project Overview

App pessoal de gestão financeira com estética "Digital Luxury" — glassmorphism, dark-first (light suportado), spring physics inspirada em Apple. Domínios: contas bancárias, cartões de crédito, faturas, gastos, receitas e rateio inteligente entre pessoas.

Design source-of-truth: projeto Stitch `projects/10419197953241415291` (acessível via MCP `mcp__stitch__*` quando o servidor estiver conectado). Toda mudança visual deve referenciar/atualizar o Stitch antes de mexer no código.

---

## Commands

```bash
pnpm dev              # Next dev server on :3000
pnpm build            # next build (rejects on type or lint errors)
pnpm start            # serve built output
pnpm lint             # ESLint (next/core-web-vitals + next/typescript)
pnpm format           # Prettier write
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run (one-shot)
pnpm test:watch       # vitest watch mode
pnpm test:coverage    # vitest with coverage
pnpm test:e2e         # playwright e2e
vitest run src/__tests__/unit/format.test.ts   # single test file

pnpm db:start         # supabase start (local stack via Docker)
pnpm db:stop          # supabase stop
pnpm db:migrate       # supabase migration new + supabase db push (local)
pnpm db:reset         # supabase db reset (drops + reseeds)
pnpm db:types         # supabase gen types typescript --local > src/lib/database.types.ts
pnpm db:seed          # tsx supabase/seed.ts (idempotent upserts)
pnpm db:studio        # opens Supabase Studio on http://localhost:54323
```

`postinstall` auto-runs `pnpm db:types` if the local Supabase is running (skipped silently otherwise). The generated `src/lib/database.types.ts` is committed and treated as read-only output — regenerate it whenever a migration changes the schema.

CI (`.github/workflows/ci.yml`) runs lint → typecheck → test → build on push/PR to `master` and `develop`, with fake env vars for the build step. The build must pass without a real database, so don't add module-load-time DB calls. A second workflow (`.github/workflows/pr-title.yml`) validates that PR titles follow Conventional Commits. Dependabot (`.github/dependabot.yml`) opens grouped weekly updates against `develop` for npm and GitHub Actions.

---

## Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL via **Supabase** (managed) with **Row Level Security**
- **Auth**: **Supabase Auth** — Google OAuth + email/password via `@supabase/ssr`
- **Styling**: Tailwind v4 (CSS-first config via `@theme`) + design tokens from Stitch design system
- **UI primitives**: shadcn/ui (Radix-based), customized for glassmorphism aesthetic
- **Animation**: Motion (`motion/react`) for spring physics
- **State / data**: TanStack Query v5 (client), server actions / RSC (server)
- **Forms**: react-hook-form + Zod resolver
- **Charts**: Recharts (gradient area charts, custom tooltips)
- **Storage**: Supabase Storage (avatars, receipts)
- **Email**: Resend (transactional — invites, password reset notifications)
- **Rate limiting**: Upstash Redis (graceful no-op when env vars missing)
- **Tests**: Vitest + Testing Library + Playwright (e2e)
- **Lint / format**: ESLint (`next/core-web-vitals` + `next/typescript`) + Prettier
- **Pre-commit**: Husky + lint-staged + commitlint
- **Env validation**: `@t3-oss/env-nextjs` + Zod
- **Locale**: pt-BR only (BRL currency, pt-BR dates via `Intl.*`)
- **Deploy target**: **Vercel** (always assume Vercel build/runtime constraints)

---

## Domain Model

The product's behavior is the source of truth — UI and schema follow these rules. Read this section before touching any feature.

### Authentication

- Sign-up / sign-in via **Google OAuth** and **email + password**.
- On first sign-up, automatically create:
  - A `profiles` row.
  - A default wallet named **"Outros"** with `is_default = true`.

### Wallets (contas bancárias)

- User adds an arbitrary number of bank accounts. No sensitive data, no bank integrations.
- On creation, user picks:
  - **Bank** from a pre-seeded lookup list (Nubank, Santander, Itaú, Inter, C6, etc.) with name + icon.
  - **Account type**: `PF` (personal) or `PJ` (business).
  - **Current balance** (in BRL, stored as cents).
- The default **"Outros"** wallet exists for every user and cannot be deleted.
- A wallet displays: name, type, available balance, invested balance (future field — keep column, leave `0` for now).
- Wallet creation surfaces via a prominent "+" FAB.

### Cards (cartões de crédito)

- Each card belongs to a wallet. If user doesn't pick one at creation, default to the **"Outros"** wallet.
- Card fields: name, total credit limit (cents), linked wallet, color (hex).
- Card list visual: **Apple Wallet–style stacked deck**, fans out on hover/tap with spring animation.
- Open card view shows: name, total limit, used limit, available limit, due date.
- Each card has monthly **invoices** listing transactions and totals.

### Invoices (faturas)

- One invoice per card per reference month.
- Generated lazily when the first transaction lands in the corresponding billing window, or pre-created at month rollover (TBD — start with lazy creation).
- Invoice detail lists transactions with: amount, date, category, split, description, installment number.
- **Display rule**: invoice/card screens always show the **real total amount** of each transaction, ignoring any split. Split only affects monthly macro dashboard and per-person settlement.

### Categories

System-seeded categories (created once, available to every user via `user_id IS NULL`):

```
Transporte, Alimentação, Pet, Compras, Mimo, Saúde, Viagem,
Pessoal, Moradia, Verificar, Assinatura, Profissional, Educação
```

Users can create custom categories scoped to themselves (`user_id = auth.uid()`).

### Contacts (pessoas)

- People the user shares expenses with (e.g. Arthur, Mãe, Isa, Gabriel, Gabriela).
- Fields: name, optional color, optional email.
- Used in both split rules (rateio) and as the counterparty in cross-person transactions.

### Splits (rateio) — critical rules

The core differentiator. Read carefully.

**Split modes** (per transaction):

- **`none`** — no split. Transaction is 100% the user's. `transaction_splits` empty.
- **`equal`** ("Dividido" toggle ON) — total amount is split **equally** between the user and every selected contact. User is automatically a participant. Example: R$ 300 with Arthur → user R$ 150, Arthur R$ 150.
- **`custom`** — user enters specific amounts for one or more contacts; the **remainder** automatically belongs to the user. Example: R$ 300 lunch, Arthur pays R$ 59 → Arthur R$ 59, user R$ 241.

**Combination rule**: equal + custom can coexist on the same transaction. Custom-valued contacts get their fixed amount; the remainder is split equally among the user (if "Dividido" is ON) and any non-custom contacts.

**"Dividido" flag** (`user_included_in_split`):

- When ON: the user is one of the participants in the equal-split pool.
- When OFF: only the listed contacts participate; the user pays nothing from the split (this models "I paid for them, they owe me").

**Display rules**:

- Card screen, invoice screen, transaction list: always show the **full real amount** (`transactions.amount_cents`).
- Macro dashboard, per-person settlement, "who owes what": use the **split amounts** (`transaction_splits.amount_cents`).

**Validation invariant**: `sum(transaction_splits.amount_cents) + user_share = transactions.amount_cents` must always hold. The use case computes `user_share` from the mode and stores splits accordingly. Verify with an integration test on every code path that creates/edits splits.

### Operations (cross-person transactions)

Same contacts can be used as the counterparty when:

- Someone pays for the user.
- The user pays with someone else's card.
- The user owes/is owed money via Pix, loan, etc.

Pre-seeded operation types (enum):

```
card, loan, pix
```

These transactions carry: amount, date, category, involved people, split, operation, description, installment. The split logic is identical to regular expenses.

### Transactions on wallets (not just cards)

Expenses can hit a wallet directly (rent, utilities, internet, MEI tax, car loan, overdraft) — not all expenses go through a card. A transaction has exactly one of `wallet_id` or `card_id` set (enforced by a CHECK constraint).

### Income

Income can land on a wallet **or** a card (interest refund, cashback, chargeback). `transactions.type = 'income'`.

### Monthly Macro Dashboard

Shows, for the selected month/year:

- **User's real spend** (sum of user's share across all transactions).
- **Per-contact totals**, broken down into:
  - Amount from equal splits.
  - Amount from custom-valued splits.
  - Total per contact.
- **Consolidated total** (everyone, real full amounts).

Example layout (preserve this hierarchy in UI copy):

```
🔘 EU            GASTO TOTAL DO MÊS: R$ 9.102,39
🟢 ARTHUR        DIVIDIDO: R$ 0,00 | DIRETO: R$ 654,99 | TOTAL: R$ 654,99
🟡 MÃE           DIVIDIDO: R$ 92,47 | DIRETO: R$ 3.942,48 | TOTAL: R$ 4.034,95
🪙 TODOS         GASTO TOTAL DO MÊS: R$ 15.444,12
```

### Monthly navigation

Every list and dashboard scopes to a month/year competence. Wallet, cards, invoices, transactions, splits, and the macro dashboard all respect the active month selector. Default to the current month on first render.

---

## Architecture — Clean Architecture (strict)

Four layers, **strict inward-only dependencies**. Never let an inner layer import from an outer one.

```
src/domain/         Entities (interfaces), repository interfaces (I*Repository),
                    enums, value objects. NO external deps. Pure types/logic.
                    e.g. Wallet, Card, Invoice, Transaction, ExpenseSplit, Contact.
src/application/    Use cases (one class per file under use-cases/<area>/), Zod
                    validation schemas, DTOs. Depends ONLY on domain.
                    e.g. CreateTransaction, SplitExpense, CloseInvoice,
                    ComputeMonthlyDashboard.
src/infrastructure/ Supabase repositories, auth setup, Resend email, storage,
                    DI container. Implements domain interfaces. Adapters live here.
src/app/            Next.js App Router (routes, layouts, server components). Calls
                    into application via the container. No business logic here.
src/components/     React components (ui, finance, layout, charts).
src/actions/        Next.js server actions ("use server"). Same role as API routes
                    for forms — call `revalidatePath` after mutations.
```

**Rules:**

- A new feature touching the database → add (or reuse) a domain entity → repository interface → Supabase repository → use case → wire it in the DI container → call from a route/action.
- **DI container**: `src/infrastructure/container/index.ts`. Instantiates singletons of repositories + services and exports `make<UseCase>()` factories + `get<X>Repository()` accessors. **Never** instantiate a Supabase repository directly in a route or action.
- **Supabase client factories**: `src/infrastructure/database/supabase/`
  - `server.ts` → `createServerClient()` for Server Components / Server Actions (reads cookies from the request).
  - `client.ts` → `createBrowserClient()` for client components.
  - `admin.ts` → service-role client. **Server-only**, used only for administrative tasks that legitimately bypass RLS (rare). Never import this from a client component.
  - `middleware.ts` → `updateSession()` helper used by `middleware.ts` at the repo root to refresh the auth cookie on every request.
- **RLS is the security boundary**, not application code. Every table has RLS enabled with `auth.uid() = user_id` policies. Repositories use the anon-key client — if a query returns no rows, that's RLS working; never bypass with the admin client to "fix" it.
- **Validation**: Zod schemas live in `src/application/validation/`. Validate at API/action boundaries before calling use cases. Share the same schema between client (`react-hook-form`) and server (action input).
- **Split logic is a use case**, not a database trigger and not UI code. `CreateTransaction` / `UpdateTransaction` use cases compute splits and persist them atomically. UI never builds split rows directly.
- After data-mutating server actions, call `revalidatePath` on the affected route(s) and/or `revalidateTag` for query invalidation.

---

## Auth

Supabase Auth via `@supabase/ssr` with **cookie-based sessions**. The middleware (`middleware.ts`) calls `updateSession()` on every request to refresh the access token transparently.

**Single entry point at `/`**: the root `src/app/page.tsx` is auth-aware and renders one of three UIs depending on the session state:

- **Not authenticated** → `<AuthBackground><AuthShell mode="signin"><LoginForm /></AuthShell></AuthBackground>` (no `/login` route exists; the login form is the root for unauthenticated visitors).
- **Authenticated but MFA pending** (AAL1 with a verified TOTP factor) → `<AuthBackground><MfaChallenge /></AuthBackground>` (inline TOTP step; the user cannot reach any protected data until they finish it).
- **Fully authenticated** (AAL2 or no MFA enrolled) → `<AppShell>` + the macro dashboard.

Other public auth pages live under `src/app/(auth)/`: `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback` (OAuth return). Logged-in users hitting `/signup` or `/forgot-password` are redirected to `/` (by middleware + a defense-in-depth check in the page). `/reset-password` is intentionally NOT bounced — the recovery magic link issues a session that the user needs to set the new password.

Protected routes live under `src/app/(app)/`. Its layout calls `requireUser()`, which redirects to `/` if the visitor is unauthenticated OR at AAL1 with MFA pending.

Server-side helpers in `src/lib/auth.ts`:

- `requireUser()` — guard for protected pages and server actions. Redirects to `/` on any failed check.
- `getOptionalUser()` — returns the user or null (no redirect). Used by auth pages doing their own defense.
- `getAuthState()` — returns `{ user, mfaPending }`. Used by the root layout (to decide whether to mount the splash) and by the root page (to choose which UI to render). Detects MFA pending via a fresh `listFactors()` call rather than the SDK's `session.user.factors` snapshot, which can be stale right after a password sign-in.

**Sign-in flow specifics:**

- Email/password sign-in returns `{ ok: true }` from the server action; the client does `window.location.href = "/"` (hard nav) so the splash mounts on a fresh page after the full flow completes.
- The forms (`LoginForm`, `SignupForm`, `GoogleButton`) set a `sessionStorage["finlux_mfa_flow"] = "1"` UX flag before submitting. `MfaChallenge` checks it on mount — if absent (the tab didn't initiate the flow itself), it signs the user out and bounces to `/`. The flag is a UX hint, not a security boundary; the real AAL2 enforcement is in `getAuthState`/`requireUser`.

OAuth providers configured: **Google**. On first sign-up the `handle_new_user` trigger creates the `profiles` row and the default "Outros" wallet.

---

## Routing

App Router with two route groups plus the root `/`:

- `/` (no group) — the auth-aware entry. Renders the login form, the MFA challenge or the dashboard depending on session state (see _Auth_ above).
- `(auth)` → other public auth pages (`/signup`, `/forgot-password`, `/reset-password`). No app chrome — wrapped by `AuthBackground` via `(auth)/layout.tsx`.
- `(app)` → authenticated app routes (`/carteira`, `/transacoes`, `/pessoas`, `/configuracoes`, `/relatorios`, `/perfil`, `/fatura/[cardId]`, `/gastos/novo`, `/gastos/[id]/editar`). Shared layout via `(app)/layout.tsx` → `AppShell` (sidebar + topbar). Each route calls `requireUser()`.

Routes mapped to Stitch reference designs:

| Tela Stitch            | Rota               | Screen ID                          |
| ---------------------- | ------------------ | ---------------------------------- |
| Dashboard Macro Mensal | `/`                | `05e68e0f4e824f9491da4f45f7e68cfb` |
| Carteira e Cartões     | `/carteira`        | `702e4d801f144e699d06c7604f8bc902` |
| Detalhamento de Fatura | `/fatura/[cardId]` | `ccdfaa51adbd4d949db9532848fe5e7e` |
| Novo Gasto e Rateio    | `/gastos/novo`     | `ba8cb2e4840e4952afb1126feedae902` |

The shared chrome lives in two reusable components — `AppShell` (`src/components/layout/AppShell.tsx`) and `AuthBackground` (`src/components/auth/AuthBackground.tsx`) — so the auth-aware root page can switch between them without duplicating layout markup.

Additional routes to plan (no Stitch screen yet — confirm with user before designing):

- `/contas` (lista de contas / wallets)
- `/contas/[walletId]` (detalhe de uma conta)
- `/pessoas` (contacts management)
- `/categorias` (categories management)
- `/configuracoes`

Whenever you create or edit a screen, run `mcp__stitch__get_screen` on the matching ID to pull the current reference HTML/CSS. Stitch is the source; code follows.

App is **pt-BR only** for now. No i18n framework. If a second language is ever needed, migrate to `next-intl` then — don't pre-abstract.

---

## Design System & Theming

**Tailwind v4** with CSS custom properties defined in `src/app/globals.css`. Tokens come from the Stitch design system (`designTheme.designMd` of the project) and are exposed via `@theme inline` as `--color-*`, `--font-*`, `--radius-*` utilities. Opacity utilities (`bg-primary-container/70`) work via Tailwind's `color-mix` shim.

### Color tokens (Obsidian Finance)

Dark theme is the **default**; light theme is a first-class supported variant (same identity, off-white background, white-translucency glass). Toggle via `next-themes` (`attribute="data-theme"`, `defaultTheme="dark"`).

**Dark palette (primary target):**

- **Page background** — `--color-background` → `bg-background` (`#131313`)
- **Body text** — `--color-on-background` → `text-on-background` (`#e5e2e1`)
- **Surface (cards/sheets)** — `--color-surface-container` → `bg-surface-container` (`#201f1f`). Combine with `backdrop-blur-xl` + `border border-white/10` for glass.
- **Surface variants** — `surface-container-low/high/highest` for stacked depth layers.
- **Primary (brand)** — `--color-primary-container` (`#8a2be2` purple) for filled CTAs; `--color-primary` (`#dcb8ff` light purple) for text-on-primary contrasts.
- **Secondary / tertiary** — purple-secondary (`#d2bbff`) and amber-tertiary (`#ffb873`) for accents / chart series.
- **On-\* foregrounds** — every surface has a matching `on-*` text token; never pair surface and text colors that aren't explicitly defined together.
- **Error** — `--color-error` (`#ffb4ab`) / `--color-error-container` (`#93000a`). Used for destructive UI and over-budget warnings.
- **Outline / outline-variant** — for dividers, input borders.

**Light palette** mirrors the dark one in semantic meaning. Background shifts to off-white (`#f5f5f7`), glass uses white translucency (`rgba(255,255,255,0.7)`), primary purple stays as accent. Keep the same `--color-*` names — only the values swap under `[data-theme="light"]`.

**Other tokens:**

- **Radius** — `--radius-sm` (4px) / `--radius` (8px) / `--radius-md` (12px) / `--radius-lg` (16px) / `--radius-xl` (24px). Cards `rounded-2xl` (16px); buttons/inputs `rounded-xl` (12px).
- **Fonts** — `--font-sans: "Inter"` (everything default); `--font-mono: "JetBrains Mono"` (only labels, monetary values in compact contexts, technical codes).

### Glass utility

Define once in `globals.css`:

```css
@utility glass-card {
  background: rgba(32, 31, 31, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
}

[data-theme="light"] .glass-card {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.06);
}
```

Use `<div className="glass-card">` instead of repeating the four-class combo.

### Visual rules (always)

- **Dark-first**: implement dark, then verify light. Both must work.
- **No drop-shadows** outside of modals/popovers. Depth comes from tonal layers + backdrop-blur, not shadow stacks. Modals use `shadow-[0_20px_40px_rgba(0,0,0,0.4)]`.
- **Spring physics**: every transition uses Motion with `transition={{ type: "spring", damping: 20, stiffness: 300 }}` unless there's a specific reason to deviate.
- **Glow on primary**: primary buttons and the FAB get `shadow-[0_0_20px_rgba(138,43,226,0.4)]` — never a hard solid shadow.
- **No raw hex colors in new code** — use a token. If a value doesn't exist as a token, add it to `@theme` rather than inlining.
- **No raw pixel typography in new code** when an existing scale fits (`text-body-md`, `text-headline-lg`, `text-label-sm` etc).
- **Validate visually**: for any UI change, run `pnpm dev` and check the change in the browser before declaring it done. Verify dark AND light themes. If you can't open the browser, say so.
- **Follow the existing layout language**: spacing, typography scale, transitions, hover states. Open the closest existing section before composing a new one.
- **Accessibility**: respect `prefers-reduced-motion` (Motion exposes a hook for this), keep focus rings visible (`focus-visible:ring-2 ring-primary-container`), maintain semantic landmarks (`<header>`, `<main>`, `<nav>`).
- **Responsive first**: mobile breakpoints must work; layout tops out at `max-w-[1200px]` (container) per the Stitch system.

---

## Database (Supabase)

Schema (created via migrations in `supabase/migrations/`):

```
auth.users                      # Managed by Supabase
public.profiles                 # 1:1 with auth.users, display name, avatar
public.banks                    # System lookup (Nubank, Itaú, ...) — no user_id
public.contacts                 # Pessoas com quem rateia (Arthur, Mãe, ...)
public.categories               # System + user-defined (Transporte, Pet, ...)
public.wallets                  # Contas bancárias (PF/PJ + saldo + invested)
public.cards                    # Cartões de crédito (limit, color, due/closing day)
public.invoices                 # Faturas mensais por cartão (month/year + dates)
public.transactions             # income | expense; wallet_id XOR card_id
public.transaction_splits       # Rateio: contato → amount (sum + user_share = total)
```

### Enums

```sql
create type transaction_type as enum ('income', 'expense');
create type account_type as enum ('PF', 'PJ');
create type operation_type as enum ('card', 'loan', 'pix');
create type split_mode as enum ('none', 'equal', 'custom');
```

### Bootstrap trigger

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.wallets (user_id, name, is_default, account_type, balance_cents)
    values (new.id, 'Outros', true, 'PF', 0);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### CHECK constraints worth calling out

- `wallets.is_default = true` allowed at most once per `user_id` (partial unique index).
- `transactions`: `(wallet_id IS NOT NULL) <> (card_id IS NOT NULL)` — exactly one.
- `transactions`: `installment_number <= installment_total`.
- `transaction_splits`: `unique (transaction_id, contact_id)` — a contact can't appear twice in the same split.
- `cards.due_day` and `cards.closing_day` between 1 and 31.

### Migrations

- Create via `pnpm supabase migration new <descriptive_name>`.
- Never edit a migration already applied to production. Always a new migration.
- Seed system categories and banks in `supabase/seed.sql` (runs on `db:reset`).
- `pnpm db:types` regenerates `src/lib/database.types.ts` after each schema change. Commit the regenerated file.
- Migrations run on Vercel deploy via the Supabase GitHub integration (or a one-off `supabase db push` from the migration job).

### RLS template (mandatory for every table with user data)

```sql
alter table public.<table> enable row level security;

create policy "users read own rows" on public.<table>
  for select using (auth.uid() = user_id);

create policy "users insert own rows" on public.<table>
  for insert with check (auth.uid() = user_id);

create policy "users update own rows" on public.<table>
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users delete own rows" on public.<table>
  for delete using (auth.uid() = user_id);
```

For shared-readable lookups (`banks`, system categories), use a permissive SELECT policy and restrict INSERT/UPDATE/DELETE to service role:

```sql
create policy "anyone reads banks" on public.banks for select using (true);
-- no insert/update/delete policies for non-service-role
```

For `categories` (mixed system + user), the SELECT policy is:

```sql
create policy "user reads own and system categories" on public.categories
  for select using (auth.uid() = user_id or user_id is null);
```

Every new table → add an integration test that proves a second user cannot see the first user's rows.

---

## Non-functional requirements

Every change must be evaluated against these four pillars. If a change weakens any of them, call it out.

- **Security**: validate every input at the boundary (Zod), never trust client data, escape user-supplied strings rendered as HTML, RLS policies on every table (`auth.uid() = user_id`), keep secrets out of the repo, rotate any secret that lands in git history. Use `requireUser()` for every protected server action. Rate-limit anything user-triggered (auth, invite, file upload). Never expose the service-role key to the client.
- **Scalability**: prefer indexed queries (add Postgres indexes on `user_id`, foreign keys, `occurred_at`, and any column used in `where`/`order by`), paginate lists, avoid N+1 (use Supabase `select` with embedded relations: `select('*, cards(*)')`), keep server actions idempotent, no module-load-time DB calls (CI builds without a DB).
- **SEO**: the app is auth-gated, so most of it is `noindex`. Public marketing/landing pages (if added) export `generateMetadata` with `title`, `description`, `openGraph`, proper `robots`. Use semantic HTML throughout.
- **Performance**: prefer Server Components, lazy-load heavy client islands (`dynamic(() => import(...))`), use `next/image` with explicit `sizes`, avoid synchronous data fetching in client components, keep bundle size in mind (audit with `next build` output). Hit the **Vercel** runtime constraints — Edge for static-ish data, Node when needed. Charts and Motion are heavy — code-split.

---

## Rate limiting & graceful degradation

`src/lib/rateLimit.ts` exports four limiters (auth/mutation/upload/invite) backed by Upstash Redis. **All four return `null` if `UPSTASH_REDIS_REST_URL`/`TOKEN` are unset** — every consumer must guard `if (limiter) { ... }`. This lets local dev and CI run without Redis. Don't change to throwing — graceful degradation is intentional.

Same pattern for Resend: notification senders inject `null` for `emailService` when `RESEND_API_KEY` is missing, and the use case skips notification silently.

---

## Code style

- Path alias `@/*` → `src/*` (`tsconfig.json` and `vitest.config.ts`).
- **Identifiers in English.** Always. (UI strings are pt-BR; identifiers are not UI strings.)
- **Comments only when the _why_ is non-obvious.** No comments restating what the code does. No tutorial-style block comments. No `// added on YYYY-MM-DD` or `// for ticket #123`. One short sentence per comment, max. Match the surrounding file (existing Portuguese comments may stay; new comments default to English unless the file is already PT).
- No dead code, no `console.log` left over, no unused imports, no commented-out blocks. Run `pnpm lint` before committing.
- Public repo on GitHub — no secrets, real personal emails, or production URLs in committed code.
- Don't introduce abstractions for hypothetical future requirements. Three similar lines beats a premature abstraction.
- **Money math**: never use floating-point arithmetic for currency. Store amounts as integers (centavos) in the DB; convert at the formatter boundary. Use `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` via `formatBRL()` in `src/lib/format.ts`. Never hardcode `R$ ` in JSX.
- **Server/Client boundary**: default to Server Components. `"use client"` only when the component uses state, effects, browser APIs, Motion, or TanStack Query hooks. Push the boundary as deep into the tree as possible.

---

## Testing — non-negotiable

Every change must ship with the tests it needs. "I'll add tests later" is not acceptable — tests land in the same PR as the code.

### What to write

- **Unit tests** — for any new logic with branches, edge cases, or non-trivial behavior. This includes: domain entities, use cases, validation schemas (Zod), pure utilities (formatters, money math, date helpers, split calculators), and hooks. Target the smallest unit; mock its collaborators. Live under `src/__tests__/unit/` mirroring the source path.
- **Integration tests** — for anything that crosses a boundary or composes multiple units. This includes: server actions, API routes, Supabase repositories against a real local instance, RLS enforcement, and end-to-end flows of a use case + repository + DB. Live under `src/__tests__/integration/`.
- **e2e tests (Playwright)** — for critical user flows: login, create transaction (with and without split), split an expense, view an invoice, navigate months. Live under `tests/e2e/`. Run against `pnpm build && pnpm start` with a local Supabase instance.

### When tests are required

- **New feature / use case** → unit tests for the use case (happy path + each failure branch) **and** an integration test for the action/route that wires it up.
- **Bug fix** → a regression test that fails on the broken code and passes on the fix. No regression test = the bug can come back silently.
- **Refactor** → existing tests must keep passing. If coverage was missing for the refactored area, add it _before_ refactoring (characterization tests).
- **New repository method** → integration test that exercises it against the local Supabase DB (real schema; not a mock). RLS policies count as behavior — test them.
- **New Zod schema** → unit tests for valid + each invalid case.
- **Money math (anything multiplying/dividing currency)** → exhaustive unit tests including rounding edges, negative amounts, and 1¢ off-by-one cases.
- **Split logic** → unit tests covering: `none`, `equal` with N contacts, `custom` only, `custom + equal` combined, custom amount exceeding total (must reject), zero participants with `equal` ON, "Dividido" OFF + custom (user pays nothing).
- **New RLS policy** → integration test that asserts a user cannot read another user's rows.

### When tests are optional

- Pure config changes (env, tsconfig, next.config) with no runtime behavior.
- Style-only refactors (rename, formatting, comment-only, dead-code removal) where existing tests already cover the behavior.
- Static asset additions.

If you skip tests, say so explicitly in the PR description and justify why. Default is: **tests are required**.

### How to run

- `pnpm test` — full unit + integration suite (must pass before commit).
- `pnpm test:watch` — TDD loop while developing.
- `pnpm test:coverage` — coverage report; don't merge a PR that drops coverage on touched files.
- `pnpm test:e2e` — Playwright e2e (slower; runs in pre-push hook, not on every commit).
- `vitest run path/to/file.test.ts` — single file when iterating.

### Test quality rules

- One behavior per test. Test names describe the behavior (`returns 401 when session is missing`), not the implementation (`calls getSession`).
- No flaky tests — if a test is non-deterministic, fix it or delete it; do not retry-loop.
- No mocking what you own at integration level — repositories hit a real local Supabase instance; only mock external boundaries (Resend, Upstash, third-party APIs).
- Don't test the framework — skip tests that just verify Next.js / Supabase / Zod do what their docs say.

---

## Git workflow — Simplified GitFlow

> **The repo is currently single-branch (`master`).** When real feature work resumes, adopt the flow below from PR #1.

### Branch model

```
master       # production. protected. only fast-forward merges from PRs.
develop      # integration. all feature/bugfix branches merge here.
feature/*    # new functionality. cut from develop, merge to develop.
bugfix/*     # non-urgent fixes. cut from develop, merge to develop.
hotfix/*     # production fixes. cut from master, merge to master AND develop.
```

### Branch naming

- Pattern: `type/short-description`
- Always **English**, **kebab-case**, short and objective.
- Examples:
  - `feature/create-transaction-form`
  - `feature/expense-split-rateio`
  - `bugfix/fix-invoice-total-rounding`
  - `bugfix/correct-rls-policy-cards`
  - `hotfix/fix-login-redirect-loop`

### Commits — Conventional Commits

- Pattern: `type(scope): description`
- Type is one of: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`.
- Scope is optional but encouraged when the change is localized (e.g. `auth`, `wallet`, `card`, `invoice`, `expense`, `split`, `dashboard`, `db`).
- Description: imperative mood, lowercase, no trailing period, **English**.
- Examples:
  - `feat(auth): add google oauth sign in`
  - `feat(split): support equal divide with custom amounts`
  - `fix(invoice): prevent off-by-one on closing date`
  - `refactor(wallet): extract balance calculation to use case`
  - `chore: update dependencies`
- **Rules:**
  - Right-sized commits — not "one giant commit per feature", not "fifteen WIP commits per feature". Each commit should be a coherent unit that compiles and passes tests on its own.
  - Never `"ajustes"`, `"corrigindo coisa"`, `"wip"`, `"."` as a message.
  - **Never list Claude as co-author.** Author is always the repo owner. No `Co-Authored-By: Claude` trailers.
  - Never bypass hooks (`--no-verify`) or signing.

### Pre-commit checklist (mandatory)

Before staging anything, walk through this list explicitly:

1. **Review the diff yourself first** — `git diff` and `git diff --staged`. Look for: leftover `console.log`, debug code, commented-out blocks, unused imports, secrets, personal emails, TODO notes that should be tickets.
2. **Lint**: `pnpm lint` passes.
3. **Types**: `pnpm typecheck` passes.
4. **Tests**: `pnpm test` passes. New logic has unit tests; new boundary code (actions, routes, repositories) has an integration test. Bug fixes have a regression test. See _Testing_ above.
5. **Build**: `pnpm build` succeeds (catches issues lint and typecheck miss).
6. **Architecture sanity**: no domain layer importing from infrastructure, no Supabase calls outside repositories, no use-case skipped in favor of inline logic, no service-role client in client components.
7. **Visual sanity** (UI changes): opened in browser, dark AND light themes correct, mobile breakpoint OK, glassmorphism renders, animations feel right (spring not linear).

### Automated guardrails (Husky)

Local Git hooks enforce part of this checklist automatically (configured via `husky` + `lint-staged` + `commitlint`):

- **`pre-commit`** → runs `lint-staged` over staged files: `eslint --fix` + `prettier --write` on TS/TSX, `prettier --write` on JSON/MD/YAML/CSS. Fast — runs only on what you staged.
- **`commit-msg`** → runs `commitlint` against `commitlint.config.js` (extends `@commitlint/config-conventional`). Rejects commits that aren't Conventional Commits.
- **`pre-push`** → runs `pnpm test` (full vitest suite) + `pnpm test:e2e` against the local stack. Catches regressions before they reach the remote.

Hooks are installed via the `prepare` script when `pnpm install` runs. **Do not bypass hooks** (`--no-verify`) — fix the underlying issue instead.

### PR rules

- **Never** commit directly to `master`. Never to `develop`.
- Every change ships via PR. At least 1 review. CI must be green.
- PR title follows Conventional Commits (e.g. `feat(invoice): add closing date editing`).
- Branches are short-lived — open the PR early, keep the diff small, rebase often.
- Use the template below.

### PR template

```markdown
## Description

What was done and why.

---

## Changes

- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Breaking change

---

## How to test

1.
2.
3.

---

## Evidence

Screenshots / logs / before-after.

---

## Notes

Anything reviewers should know (migration order, env vars, follow-ups).
```

---

## Env vars

Validated in `src/lib/env.ts` via `@t3-oss/env-nextjs`:

- **server**: `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` (optional), `UPSTASH_REDIS_REST_URL` (optional), `UPSTASH_REDIS_REST_TOKEN` (optional).
- **client**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.

`.env.local` (gitignored) for dev. `.env.example` committed with placeholders. Never `process.env.X` directly in code — always import from `@/lib/env`.

---

## Deployment

Target: **Vercel**. The build must work without a live database (CI uses fake env vars). Anything required at runtime goes in Vercel env vars; never inline secrets.

Supabase is split between local and production:

- **local**: Docker stack via `supabase start`, used for dev + e2e.
- **production**: managed Supabase project. Migrations applied via `supabase db push` from a GitHub Action triggered on merge to `master` (or manually for hotfixes).

`next build` should not run migrations.
