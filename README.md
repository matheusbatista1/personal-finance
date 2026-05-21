# Personal Finance

Personal finance management app with a "Digital Luxury" aesthetic — glassmorphism, dark-first (light supported), Apple-inspired spring physics. Domains: bank accounts, credit cards, invoices, expenses, income, and smart expense splitting between people.

The product is **pt-BR only** (BRL currency, pt-BR dates). Code, identifiers, and documentation are kept in English.

> Status: bootstrap — repo skeleton only. Application code, schema, and screens land in subsequent commits per the plan in `CLAUDE.md`.

---

## Highlights

- **Wallet + cards model** — every user starts with a default "Outros" wallet; cards belong to wallets and surface as an Apple Wallet-style stacked deck.
- **Monthly invoices** per card, generated lazily on the first transaction of the billing window.
- **Expense splitting (rateio)** — three modes per transaction (`none`, `equal`, `custom`), composable with a `"Dividido"` flag that decides whether the user enters the equal-split pool.
- **Macro dashboard** that always shows the user's real share plus per-contact totals broken into "dividido" and "direto".
- **Auth** via Google OAuth and email/password (Supabase Auth + `@supabase/ssr` cookies).
- **Row Level Security** as the only security boundary; repositories use the anon-key client.

See `CLAUDE.md` for the full domain model, architecture, and non-functional requirements.

---

## Stack

- **Framework** — Next.js 15 (App Router) + React 19
- **Language** — TypeScript (strict)
- **Database** — PostgreSQL via Supabase with RLS
- **Auth** — Supabase Auth (`@supabase/ssr`)
- **Styling** — Tailwind v4 (`@theme` CSS-first config) + Obsidian Finance design tokens
- **UI** — shadcn/ui (Radix) customized for glassmorphism
- **Animation** — Motion (`motion/react`) — spring physics by default
- **Data** — TanStack Query v5 on the client; Server Components / Server Actions on the server
- **Forms** — react-hook-form + Zod
- **Charts** — Recharts
- **Storage / email / rate limit** — Supabase Storage, Resend, Upstash Redis (graceful no-op when env vars are absent)
- **Tests** — Vitest + Testing Library + Playwright
- **Lint / format** — ESLint (`next/core-web-vitals` + `next/typescript`) + Prettier
- **Pre-commit** — Husky + lint-staged + commitlint
- **Deploy** — Vercel

---

## Getting started

> The skeleton commits will land alongside this README. Once `package.json` exists, the flow below applies.

Prerequisites:

- Node 20+
- pnpm 9+
- Docker (for the local Supabase stack)

```bash
pnpm install
cp .env.example .env.local        # fill the placeholders
pnpm db:start                     # supabase local stack
pnpm db:reset                     # apply migrations + seed
pnpm dev                          # next dev on http://localhost:3000
```

Useful scripts:

```bash
pnpm dev              # next dev (:3000)
pnpm build            # next build (rejects type or lint errors)
pnpm lint             # eslint
pnpm typecheck        # tsc --noEmit
pnpm test             # vitest run
pnpm test:e2e         # playwright e2e
pnpm db:start         # supabase start (Docker)
pnpm db:reset         # drop + reseed local DB
pnpm db:types         # regenerate src/lib/database.types.ts
pnpm db:studio        # http://localhost:54323
```

---

## Architecture

Strict Clean Architecture — inward-only dependencies.

```
src/domain/         Entities, repository interfaces, enums, value objects.
                    No external dependencies.
src/application/    Use cases, Zod schemas, DTOs.
                    Depends only on domain.
src/infrastructure/ Supabase repositories, auth, storage, email, DI container.
                    Implements domain interfaces.
src/app/            Next.js App Router. Routes call into application via the
                    container — no business logic here.
src/components/     React components (ui, finance, layout, charts).
src/actions/        Server actions ("use server").
```

Adding a feature that touches the database:

1. Define / reuse a domain entity and repository interface.
2. Implement the repository against Supabase in `src/infrastructure`.
3. Wire it into the DI container in `src/infrastructure/container/index.ts`.
4. Implement the use case in `src/application/use-cases/<area>/`.
5. Call the use case from a route, page, or server action.
6. Add unit tests for the use case and integration tests for the boundary.

Split logic lives in `CreateTransaction` / `UpdateTransaction` use cases — never in UI or DB triggers. The invariant `sum(splits) + user_share = transaction.amount` is enforced and tested on every code path that touches splits.

---

## Routes

| Screen                  | Route              |
| ----------------------- | ------------------ |
| Macro monthly dashboard | `/dashboard`       |
| Wallets and cards       | `/carteira`        |
| Invoice detail          | `/fatura/[cardId]` |
| New expense and split   | `/gastos/novo`     |

Public auth pages: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/callback`.

---

## Design system

Dark-first with a first-class light mode. Color, radius, and typography tokens are defined in `src/app/globals.css` under `@theme inline` and mirror the Stitch "Purple Finance Premium" reference. The `glass-card` utility encapsulates the glassmorphism recipe (translucent background + `backdrop-blur-xl` + `border-white/10`). Motion uses `spring` with `damping: 20, stiffness: 300` by default; primary surfaces glow with `shadow-[0_0_20px_rgba(138,43,226,0.4)]`.

Visual rules:

- No raw hex values in new code — always go through a token.
- No drop shadows outside modals/popovers; depth comes from tonal layers + blur.
- Respect `prefers-reduced-motion`; keep focus rings visible.
- Money math always uses integer cents; never floating point.

---

## Git workflow

Simplified GitFlow:

```
master   # production. only fast-forward merges from PRs.
develop  # integration. feature/bugfix branches merge here.
feature/*, bugfix/*, hotfix/*
```

Commits follow Conventional Commits (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`) with an imperative, lowercase, English description. PR titles follow the same convention and are validated in CI.

---

## License

[MIT](./LICENSE) © 2026 Matheus Batista
