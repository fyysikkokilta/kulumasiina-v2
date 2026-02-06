# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kulumasiina v2 is an expense management application built for Fyysikkokilta (Guild of Physics). Users submit expense claims with receipt attachments, and admins review/approve/pay them. Supports both regular expense items and mileage claims. Bilingual (Finnish/English).

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19 and React Compiler
- **Language:** TypeScript 5.9 (strict mode)
- **Database:** PostgreSQL with Drizzle ORM (snake_case convention)
- **Styling:** Tailwind CSS 4 + Base UI React components
- **Auth:** Google OAuth 2.0 with JWT sessions (jose)
- **i18n:** next-intl (locales: en, fi) — routes are prefixed `/en/` or `/fi/`
- **Validation:** Zod 4 + next-safe-action for type-safe server actions
- **File Storage:** Pluggable local filesystem or S3/R2 (via MinIO client)
- **Package Manager:** pnpm (enforced, no npm/yarn)

## Common Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm type:check       # TypeScript type checking (tsc --noEmit)
pnpm lint --fix       # ESLint with autofix
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:push          # Push schema changes to database
pnpm db:migrate       # Run migrations programmatically
pnpm db:studio        # Open Drizzle Studio GUI
npx playwright test                    # Run all E2E tests
npx playwright test tests/admin-actions.spec.ts  # Run a single test file
```

**After editing any code, always run `pnpm type:check` then `pnpm lint --fix`.**

## Architecture

### Routing & Pages

- `src/app/[locale]/page.tsx` — Public expense submission form
- `src/app/[locale]/login/page.tsx` — Google OAuth login
- `src/app/[locale]/admin/page.tsx` — Protected admin dashboard (requires auth + ADMIN_EMAILS)
- `src/app/api/` — REST API routes (auth, attachments, PDF/CSV export, bulk ZIP)

### Key Directories

- `src/lib/db/schema.ts` — Drizzle database schema (entries, items, mileages, attachments)
- `src/lib/actions/` — Server actions using next-safe-action with Zod validation
- `src/lib/env.ts` — Type-safe environment config via @t3-oss/env-nextjs
- `src/lib/storage.ts` — File storage abstraction (local or S3)
- `src/data/` — Data fetching utilities (server-side)
- `src/i18n/` — Internationalization config and message files (en.json, fi.json)
- `src/components/` — React components
- `tests/` — Playwright E2E tests with shared utilities in `tests/utils/`

### Database Schema

Four tables with cascade deletes: `entries` → `items` → `attachments`, and `entries` → `mileages`. Entry status enum: `submitted | approved | paid | denied`.

### ESLint Rules to Know

- **No JSX string literals** (`react/jsx-no-literals`) — all user-facing text must use i18n
- **Import `Link`, `redirect`, `useRouter`, `usePathname` from `@/i18n/routing`** — not from `next/link` or `next/navigation`
- **Import sorting** enforced via `simple-import-sort`

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/): `type: lowercase description` (no period, imperative mood, max 72 chars). Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore.

## Prerequisites

- PostgreSQL database
- Ghostscript (required for PDF compression, installed in Docker/CI)
- Environment variables — see `.env.example` for the full list
