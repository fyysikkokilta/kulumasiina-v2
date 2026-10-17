# Development Guide

## Prerequisites

- **Node.js** 26 or later
- **pnpm** 11 or later (`npm install -g pnpm`)
- **PostgreSQL** 14 or later (local install, Docker, or a managed service)
- **Ghostscript** (required for PDF compression; see [compress-pdf](https://github.com/victorsoares96/compress-pdf) for installation)

## Setup

```bash
# Clone the repository
git clone https://github.com/fyysikkokilta/kulumasiina-v2.git
cd kulumasiina-v2

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env — required: DATABASE_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ADMIN_EMAILS, BASE_URL, JWT_SECRET,
# NOCFO_API_TOKEN, NOCFO_BUSINESS_SLUG
# optional: NOCFO_API_URL (default https://api.nocfo.io), NOCFO_BANK_ACCOUNT (default 1910)

# Run database migrations
pnpm db:migrate

# Start the development server
pnpm dev
```

The app runs at `http://localhost:3000`. Navigate to `/en/` or `/fi/` for the app.

## Available Scripts

| Command                       | Description                                         |
| ----------------------------- | --------------------------------------------------- |
| `pnpm dev`                    | Start development server with hot reload            |
| `pnpm build`                  | Create production build                             |
| `pnpm start`                  | Start production server (after build)               |
| `pnpm lint`                   | Lint with oxlint                                    |
| `pnpm lint --fix`             | Lint and auto-fix                                   |
| `pnpm format`                 | Format code with oxfmt                              |
| `pnpm format:check`           | Check formatting without fixing                     |
| `pnpm typecheck`              | TypeScript type check (`tsgo --noEmit`)             |
| `pnpm db:migrate`             | Run pending database migrations                     |
| `pnpm db:generate`            | Generate migration from schema changes              |
| `pnpm db:push`                | Push schema to DB (dev only; skips migration files) |
| `pnpm db:studio`              | Open Drizzle Studio (database GUI)                  |
| `pnpm cleanup-orphaned-files` | Remove orphaned files from storage (local script)   |

## Testing

Tests use Playwright. They need Docker (for a throwaway Postgres) and nothing else: no `.env` setup.

```bash
pnpm test:db                  # start the test database on port 55432
pnpm test                     # run every test in every browser
pnpm test:db:stop             # stop and delete the test database
```

Useful variants:

```bash
pnpm test tests/admin-actions.spec.ts   # one file
pnpm test --project=chromium            # one browser
pnpm test:node                          # node-side tests only: no dev server, no database
npx playwright show-report              # open the report of the last run
```

How it works:

- **Env:** `playwright.config.ts` sets every required variable to a test default. It deliberately does not read `.env`, because the test seed deletes all entries and must never hit your dev database. Variables already set in your shell win (CI only sets `DATABASE_URL`), except `NOCFO_*`: those always point at the fake NoCFO that global setup starts on port 55433, so tests never reach real NoCFO.
- **Database:** a global setup runs the migrations against the test database before the tests start.
- **Dev server:** Playwright starts its own `pnpm dev`. Stop your own dev server first: it uses your `.env`, so Playwright refuses to reuse it and fails with "port 3000 is already used".
- **Node-side tests:** tag a test with `{ tag: '@node' }` if it only calls functions directly; `pnpm test:node` runs just those.

## Database

### Schema

The schema is defined in `src/db/schema.ts` using Drizzle ORM. Key tables:

| Table        | Purpose                                                                         |
| ------------ | ------------------------------------------------------------------------------- |
| `entry`      | Expense claim (contact, IBAN, status, submission/approval/paid/rejection dates) |
| `item`       | Individual expense line items (description, date, account)                      |
| `mileage`    | Mileage claims (route, distance, plate, account)                                |
| `attachment` | Receipt/file attachments linked to items                                        |

Entry status: `submitted` → `approved` or `denied`; approved entries can move to `paid`. Cascade deletes: entry → items → attachments; entry → mileages.

### Making Schema Changes

1. Edit `src/db/schema.ts`
2. Generate a migration: `pnpm db:generate`
3. Review the generated SQL in `src/drizzle/`
4. Apply: `pnpm db:migrate`
5. Commit both the schema change and migration file

## Code Conventions

- **Package manager:** pnpm (enforced via preinstall hook)
- **Imports:** Use `@/` path alias for `src/` (e.g., `import { db } from '@/db'`)
- **Navigation:** Import `Link`, `redirect`, `useRouter`, `usePathname` from `@/i18n/routing`, not from `next/link` or `next/navigation`
- **Translations:** All user-facing text must go through the i18n translation system — no hardcoded strings in JSX
- **Commit format:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, etc.

### Pre-commit Hook

Lint-staged runs on every commit:

1. `tsgo --noEmit` — TypeScript type check
2. `oxlint --fix` — Linting with auto-fix
3. `oxfmt` — Code formatting

After editing code, run `pnpm typecheck`, then `pnpm lint --fix`, then `pnpm format` before committing.

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # Locale-prefixed routes (en, fi)
│   │   ├── page.tsx         # Public expense form
│   │   ├── login/          # Google OAuth login
│   │   └── admin/          # Admin dashboard
│   └── api/                # API routes (auth, attachments, PDF export, cleanup)
├── components/             # React components
├── data/                   # Server-side data fetching
├── db/                     # Drizzle schema, client, migrate script
├── i18n/                   # next-intl config and message files (en.json, fi.json)
├── lib/
│   ├── actions/            # Server actions (next-safe-action + Zod)
│   ├── env.ts              # Environment validation (@t3-oss/env-nextjs)
│   └── storage.ts          # File storage (local or S3/R2)
├── utils/                  # Validation, PDF helpers
└── ...
tests/                      # Playwright E2E tests and utilities
```

## Orphaned File Cleanup

The app can delete files in storage that are no longer referenced in the database. Trigger via the protected API:

- **Endpoint:** `POST /api/cleanup-orphaned-files`
- **Protection:** Header `x-cleanup-secret` or query `?secret=...` (value from `FILE_CLEANUP_SECRET`)

See the main [README](README.md) for details.
