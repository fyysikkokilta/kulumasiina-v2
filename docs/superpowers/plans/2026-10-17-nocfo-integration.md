# NoCFO Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pressing Pay sends paid claims to NoCFO as one bookkeeping document per payee (receipt PDFs attached), replacing the Procountor CSV/ZIP export.

**Architecture:** Pure mapping logic (grouping, amounts, blueprint) lives in `src/lib/nocfo-documents.ts`; a thin `fetch`-based API client in `src/lib/nocfo.ts`; `payEntriesAction` orchestrates per payee group and marks only successful groups paid. Tests hit a small fake NoCFO HTTP server, never the real API.

**Tech Stack:** Next.js 16 server actions (next-safe-action), Drizzle ORM, Zod 4, @t3-oss/env-nextjs, Playwright (`@node` tag for pure tests).

**Spec:** `docs/superpowers/specs/2026-10-17-nocfo-integration-design.md`

## Global Constraints

- Work on branch `feat/nocfo-integration` (not `master`).
- After every code change: `pnpm typecheck`, `pnpm lint --fix`, `pnpm format`.
- No JSX string literals; all UI text in both `src/i18n/en.ts` and `src/i18n/fi.ts`.
- Import `Link`/`redirect`/`useRouter`/`usePathname` from `@/i18n/routing`.
- Conventional commits, lowercase, imperative, ≤72 chars, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- NoCFO auth header: `Authorization: Token <NOCFO_API_TOKEN>`. Base paths: `/v1/business/{NOCFO_BUSINESS_SLUG}/...`. List responses are paginated `{ count, next, previous, results }`.
- Amounts to NoCFO are integer cents. VAT 0 on every line (`vat_rate: 0`).
- `NOCFO_PAYABLE_ACCOUNT` default is the placeholder `TODO`; an unknown account number must fail Pay with an error naming it.
- No new npm dependencies (use global `fetch`, `FormData`, `Blob`, `node:http`).

## Review Focus

1. Zero-value lines (item whose attachments are all `isNotReceipt` or have no value) → line dropped, not sent as a 0-cent entry (Task 1 test).
2. Float money (e.g. `10.1 + 0.2`, `123.4 km × 0.25`) → each line rounded to cents, credit total = sum of rounded debit lines, so the document always balances (Task 1 test).
3. Same payee typed differently (`fi21 1234…` vs `FI2112…`, `govId` `null` vs `''`) → one group (Task 1 test).
4. Pay pressed twice / selection containing already-paid entries → only `approved` entries are processed; any non-approved id fails the whole action before NoCFO is called (Task 4 test).
5. Placeholder `TODO` or unknown account number → Pay fails for that group with the account number in the message; entries stay `approved` (Task 4 test).

---

### Task 1: Pure NoCFO document mapping

**Files:**

- Create: `src/lib/nocfo-documents.ts`
- Test: `tests/nocfo-documents.spec.ts` (all tests tagged `@node`)

**Interfaces:**

- Consumes: `EntryWithItemsAndMileages` from `@/db/types`; `env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE`.
- Produces:
  - `type DocumentLine = { accountNumber: string | null; description: string; amountCents: number }`
  - `type BlueprintEntry = { account_id: number; description: string; amount: number; vat_rate: 0 }`
  - `type NocfoDocumentCreate = { date: string; description: string; is_draft: false; attachment_ids: number[]; blueprint: { debet_entries: BlueprintEntry[]; credit_entries: BlueprintEntry[] } }`
  - `toCents(euros: number): number`
  - `payeeKey(e: { iban: string; govId: string | null }): string`
  - `groupByPayee<T extends { iban: string; govId: string | null }>(entries: T[]): T[][]` (input order preserved within and across groups)
  - `documentLines(entry: EntryWithItemsAndMileages): DocumentLine[]`
  - `entriesMissingAccounts(entries: EntryWithItemsAndMileages[]): string[]` (entry ids)
  - `documentMarker(entryIds: string[]): string`
  - `buildDocumentPayload(args: { entries: EntryWithItemsAndMileages[]; paidDate: Date; accountIds: Map<string, number>; payableAccountId: number; attachmentIds: number[] }): NocfoDocumentCreate`

- [ ] **Step 1: Write the failing tests**

```ts
test('toCents rounds float euros', { tag: '@node' }, () => {
  expect(toCents(10.1 + 0.2)).toBe(1030)
  expect(toCents(123.4 * 0.25)).toBe(3085)
})

test(
  'groupByPayee ignores whitespace and case, treats null and empty govId alike',
  { tag: '@node' },
  () => {
    const a = { id: 'a', iban: 'FI21 1234 5600 0007 85', govId: null }
    const b = { id: 'b', iban: 'fi2112345600000785', govId: '' }
    const c = { id: 'c', iban: 'FI2112345600000785', govId: '010101-123N' }
    expect(groupByPayee([a, b, c]).map((g) => g.map((e) => e.id))).toEqual([['a', 'b'], ['c']])
  }
)

test(
  'documentLines sums receipt values, skips non-receipts and zero lines',
  { tag: '@node' },
  () => {
    // entry fixture: item1 account '4205' attachments [{value:10,isNotReceipt:false},{value:99,isNotReceipt:true}],
    // item2 account '4205' attachments [{value:null,isNotReceipt:false}],
    // mileage account '4300' distance 100 (rate from test env default 0.25)
    expect(documentLines(entry)).toEqual([
      { accountNumber: '4205', description: 'item1', amountCents: 1000 },
      { accountNumber: '4300', description: 'Kilometrikorvaus: trip', amountCents: 2500 }
    ])
  }
)

test('entriesMissingAccounts lists entries with any null account', { tag: '@node' }, () => {
  expect(entriesMissingAccounts([entryWithAccounts, entryMissingMileageAccount])).toEqual([
    entryMissingMileageAccount.id
  ])
})

test('documentMarker is order independent', { tag: '@node' }, () => {
  expect(documentMarker(['bbbbbbbb-1', 'aaaaaaaa-2'])).toBe('[KM:aaaaaaaa,bbbbbbbb]')
  expect(documentMarker(['aaaaaaaa-2', 'bbbbbbbb-1'])).toBe('[KM:aaaaaaaa,bbbbbbbb]')
})

test('buildDocumentPayload balances and embeds the marker', { tag: '@node' }, () => {
  const payload = buildDocumentPayload({
    entries: [entry],
    paidDate: new Date('2026-10-17T00:00:00Z'),
    accountIds: new Map([
      ['4205', 11],
      ['4300', 12]
    ]),
    payableAccountId: 99,
    attachmentIds: [501]
  })
  expect(payload.date).toBe('2026-10-17')
  expect(payload.is_draft).toBe(false)
  expect(payload.attachment_ids).toEqual([501])
  expect(payload.description).toContain(documentMarker([entry.id]))
  expect(payload.blueprint.debet_entries.map((e) => [e.account_id, e.amount])).toEqual([
    [11, 1000],
    [12, 2500]
  ])
  expect(payload.blueprint.credit_entries).toEqual([
    { account_id: 99, description: expect.any(String), amount: 3500, vat_rate: 0 }
  ])
})
```

Build the `entry` fixtures inline in the spec file as plain objects typed `EntryWithItemsAndMileages`.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:node tests/nocfo-documents.spec.ts`
Expected: FAIL, cannot resolve `@/lib/nocfo-documents`.

- [ ] **Step 3: Implement `src/lib/nocfo-documents.ts`**

- `payeeKey`: `${iban.replace(/\s/g, '').toUpperCase()}|${(govId ?? '').replace(/\s/g, '').toUpperCase()}`.
- `documentLines`: item amount = sum of `value` over attachments with `!isNotReceipt`, like `generateCsvInfoFromEntry` today; mileage description `Kilometrikorvaus: ${description}`, amount `distance * NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE`; round each line with `toCents`; drop lines with `amountCents === 0`.
- `buildDocumentPayload`: description `Kulukorvaus: ${names} – ${titles} ${marker}` (unique names/titles joined with `, `). Keep the marker intact if you truncate. Date is `paidDate` as `YYYY-MM-DD`. Credit amount is the sum of the debit amounts. Throws if an account number has no id in `accountIds` (callers check first).

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test:node tests/nocfo-documents.spec.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git checkout -b feat/nocfo-integration
git add src/lib/nocfo-documents.ts tests/nocfo-documents.spec.ts
git commit -m "feat: map entries to nocfo document payloads"
```

---

### Task 2: NoCFO API client, env vars and fake server

**Files:**

- Create: `src/lib/nocfo.ts`, `tests/utils/fake-nocfo.ts`, `tests/nocfo-client.spec.ts` (`@node`)
- Modify: `src/lib/env.ts`, `.env.example`, `playwright.config.ts` (`testEnv`)

**Interfaces:**

- Consumes: `NocfoDocumentCreate` (Task 1).
- Produces:
  - env: `NOCFO_API_URL` (default `https://api.nocfo.io`), `NOCFO_API_TOKEN` (`z.string()`), `NOCFO_BUSINESS_SLUG` (`z.string()`), `NOCFO_PAYABLE_ACCOUNT` (default `'TODO'`, with comment `// TODO: placeholder, set the real payable account number`)
  - `class NocfoError extends Error { status: number; body: string }`
  - `findAccountId(number: string): Promise<number | null>` → `GET /account/?number=<n>`, first result's `id` or `null`
  - `findDocumentIdByMarker(marker: string): Promise<number | null>` → `GET /document/?search=<marker>`, first result whose `description` includes `marker`
  - `uploadFile(name: string, data: Buffer): Promise<number>` → `POST /file_upload/` multipart (`file`, `name`), returns `id`
  - `createDocument(payload: NocfoDocumentCreate, idempotencyKey: string): Promise<number>` → `POST /document/` JSON with `Idempotency-Key` header, returns `id`
  - Fake server: `startFakeNocfo(port: number): Promise<{ close(): Promise<void> }>`, with control routes `POST /__reset` (clears documents and request log), `POST /__clear-requests` (request log only), `GET /__requests` (array of `{ method, path, headers, body }`, body parsed for JSON, `'<multipart>'` otherwise), `POST /__fail-next-document` (next `POST /document/` returns 500). Known accounts: `4205→11`, `4300→12`, `2951→99`; any other number returns empty results. `search` matches against stored document descriptions.
  - `testEnv` additions: `NOCFO_API_URL: 'http://localhost:55433'`, `NOCFO_API_TOKEN: 'test-nocfo-token'`, `NOCFO_BUSINESS_SLUG: 'test-guild'`, `NOCFO_PAYABLE_ACCOUNT: '2951'`.

- [ ] **Step 1: Write the failing tests** (spec starts the fake on port 55434 in `beforeAll` and sets `process.env.NOCFO_API_URL` before dynamically importing `@/lib/nocfo`)

```ts
test(
  'findAccountId resolves known numbers and returns null for unknown',
  { tag: '@node' },
  async () => {
    expect(await findAccountId('4205')).toBe(11)
    expect(await findAccountId('TODO')).toBeNull()
  }
)

test('createDocument sends token and idempotency key', { tag: '@node' }, async () => {
  const id = await createDocument(payload, 'key-1')
  expect(id).toEqual(expect.any(Number))
  const [req] = await requests('POST', '/v1/business/test-guild/document/')
  expect(req.headers.authorization).toBe('Token test-nocfo-token')
  expect(req.headers['idempotency-key']).toBe('key-1')
})

test('findDocumentIdByMarker finds a created document', { tag: '@node' }, async () => {
  const id = await createDocument(payloadWithMarker('[KM:aaaaaaaa]'), 'key-2')
  expect(await findDocumentIdByMarker('[KM:aaaaaaaa]')).toBe(id)
  expect(await findDocumentIdByMarker('[KM:zzzzzzzz]')).toBeNull()
})

test('non-2xx responses throw NocfoError with status and body', { tag: '@node' }, async () => {
  await fetch(`${fake}/__fail-next-document`, { method: 'POST' })
  await expect(createDocument(payload, 'key-3')).rejects.toMatchObject({ status: 500 })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:node tests/nocfo-client.spec.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement env vars, `src/lib/nocfo.ts` (one private `request(path, init)` helper that adds the auth header, throws `NocfoError` on `!res.ok`, and parses JSON) and `tests/utils/fake-nocfo.ts` (`node:http`)**

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test:node tests/nocfo-client.spec.ts && pnpm typecheck`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/nocfo.ts src/lib/env.ts .env.example playwright.config.ts tests/utils/fake-nocfo.ts tests/nocfo-client.spec.ts
git commit -m "feat: add nocfo api client"
```

---

### Task 3: Store the NoCFO document id on entries

**Files:**

- Modify: `src/db/schema.ts` (`entry`), `src/lib/actions/resetEntries.ts`
- Create: new migration under `src/drizzle/` via `pnpm db:generate`

**Interfaces:**

- Produces: `entry.nocfoDocumentId: integer()` nullable (column `nocfo_document_id`).

- [ ] **Step 1: Add the column and generate the migration**

Run: `pnpm db:generate`
Expected: a new folder in `src/drizzle/` whose SQL is `ALTER TABLE "entry" ADD COLUMN "nocfo_document_id" integer;`.

- [ ] **Step 2: Clear it in `resetEntriesAction`** (add `nocfoDocumentId: null` to the `.set({...})`).

- [ ] **Step 3: Verify**

Run: `pnpm typecheck && pnpm test tests/admin-actions.spec.ts -g "reset" --project=chromium`
Expected: PASS (global setup applies the migration).

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts src/drizzle src/lib/actions/resetEntries.ts
git commit -m "feat: track nocfo document id on entries"
```

---

### Task 4: Send to NoCFO on Pay

**Files:**

- Modify: `src/lib/actions/payEntries.ts`, `src/components/PayModal.tsx`, `src/i18n/en.ts`, `src/i18n/fi.ts`, `tests/global-setup.ts`, `tests/utils/seed.ts`, `tests/admin-actions.spec.ts`

**Interfaces:**

- Consumes: Tasks 1–3 (`groupByPayee`, `entriesMissingAccounts`, `documentLines`, `documentMarker`, `buildDocumentPayload`, `findAccountId`, `findDocumentIdByMarker`, `uploadFile`, `createDocument`, `NocfoError`, `entry.nocfoDocumentId`); `generatePartsFromEntry`, `generateCombinedPDF` from `@/utils/pdf-utils`.
- Produces: `payEntriesAction` input `{ ids: string[]; date: Date; sendToNocfo: boolean }`, output `{ success: true; failed: { entryIds: string[]; reason: string }[] }`.

Action flow (`sendToNocfo: true`):

1. Load the entries with items, attachments and mileages. If any id is missing or not `approved`, throw `ActionError` before calling NoCFO.
2. If `entriesMissingAccounts` is non-empty, throw `ActionError` naming those entry titles.
3. Resolve every distinct account number plus `NOCFO_PAYABLE_ACCOUNT` once with `findAccountId`. A group whose numbers include an unresolved one fails with a reason naming the number(s).
4. For each `groupByPayee` group, in sequence: `findDocumentIdByMarker(documentMarker(ids))`. If nothing is found, generate the paid PDF per entry, upload each with `uploadFile`, then `createDocument(payload, \`${marker}|${YYYY-MM-DD}\`)`. On success, one `db.update`sets`status: 'paid'`, `paidDate`and`nocfoDocumentId`for that group's ids. On failure,`console.error`the group ids with the`NocfoError`status and body, and push`{ entryIds, reason }`.
5. `updateTag('admin-entries')`; return `{ success: true, failed }`.

With `sendToNocfo: false`, keep today's behaviour (only approved entries are updated).

PayModal: add a checkbox field `sendToNocfo`, default checked, label key `PayModal.send_to_nocfo`. When `failed` is non-empty, keep the modal open and list each failure, using key `PayModal.failed_entries` plus the reason. Translations:

- en: `send_to_nocfo: 'Send to NoCFO'`, `failed_entries: 'Not sent to NoCFO (still approved):'`
- fi: `send_to_nocfo: 'Lähetä NoCFOon'`, `failed_entries: 'Ei lähetetty NoCFOon (yhä hyväksytty):'`

Test wiring: `globalSetup` starts `startFakeNocfo(55433)` and returns its `close` as teardown. The seed sets `account: '4205'` on the items of every approved test entry.

- [ ] **Step 1: Write the failing Playwright tests in `tests/admin-actions.spec.ts`** (`beforeEach` posts `/__reset` to `http://localhost:55433`)

```ts
test('pay sends one nocfo document per payee with pdf attached', async ({ page }) => {
  // pay testEntryIds.approved via the modal as in 'can pay an approved entry'
  const reqs = await nocfoRequests()
  expect(reqs.filter((r) => r.path.endsWith('/file_upload/'))).toHaveLength(1)
  const docs = reqs.filter((r) => r.method === 'POST' && r.path.endsWith('/document/'))
  expect(docs).toHaveLength(1)
  expect(docs[0].body.blueprint.credit_entries[0].account_id).toBe(99)
  expect(docs[0].headers['idempotency-key']).toBeTruthy()
  await expect(statusTag(approvedRow, 'PAID')).toBeVisible()
})

test('pay without nocfo only marks paid', async ({ page }) => {
  // untick 'Send to NoCFO', submit
  expect((await nocfoRequests()).length).toBe(0)
  await expect(statusTag(approvedRow, 'PAID')).toBeVisible()
})

test('failed nocfo send leaves entry approved and shows the failure', async ({ page }) => {
  await fetch('http://localhost:55433/__fail-next-document', { method: 'POST' })
  // pay testEntryIds.approved
  await expect(page.getByRole('dialog')).toContainText('Not sent to NoCFO')
  await expect(statusTag(approvedRow, 'APPROVED')).toBeVisible()
})

test('retry after lost response reuses existing nocfo document', async ({ page }) => {
  // pre-create a document on the fake whose description contains documentMarker([testEntryIds.approved])
  // pay testEntryIds.approved
  const docs = (await nocfoRequests()).filter(
    (r) => r.method === 'POST' && r.path.endsWith('/document/')
  )
  expect(docs).toHaveLength(0)
  await expect(statusTag(approvedRow, 'PAID')).toBeVisible()
})
```

Add two more tests:

- **Unknown account:** add one approved seed entry whose item account is `'9999'`, which the fake doesn't know. Paying it shows `9999` in the dialog, and the entry stays `APPROVED`.
- **Already paid:** paying a selection that includes an already-paid entry shows an error, and `nocfoRequests()` is empty.

For the retry test, pre-create the document by POSTing to the fake's normal `/v1/business/test-guild/document/` endpoint, then call `POST /__clear-requests` (clears the request log, keeps stored documents).

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test tests/admin-actions.spec.ts --project=chromium`
Expected: the new tests FAIL (no checkbox, no NoCFO requests).

- [ ] **Step 3: Implement the action, modal, translations, global setup and seed changes as specified above**

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test tests/admin-actions.spec.ts --project=chromium && pnpm typecheck && pnpm lint --fix && pnpm format`
Expected: all PASS, including the existing 'can pay an approved entry'.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/payEntries.ts src/components/PayModal.tsx src/i18n tests
git commit -m "feat: send paid entries to nocfo"
```

---

### Task 5: Remove the Procountor export

**Files:**

- Delete: `src/utils/csv-utils.ts`, `src/app/api/entry/[id]/csv/`, `src/app/api/entry/multi/zip/`, `tests/csv-utils.spec.ts`
- Modify: `src/components/AdminEntryTableColumns.tsx` (CSV button), `src/components/AdminEntryTable.tsx` (Download ZIP bulk action), `src/components/ExportPage.tsx` (drop csv/zip allow-list patterns), `tests/export-api.spec.ts` (drop csv/zip cases, keep pdf ones), `src/lib/env.ts` + `.env.example` (remove `MILEAGE_PROCOUNTOR_PRODUCT_ID`), `src/i18n/en.ts` + `fi.ts` (remove unused `csv`/`zip`/`download_zip` keys; `DeleteOldArchivedModal.text_2` → en `'Make sure that each paid entry has been sent to NoCFO.'`, fi equivalent), `docs/*.md` mentions of Procountor/CSV export.

**Interfaces:**

- Consumes: nothing new. If `withUniquePdfFilenames` or other `csv-utils` helpers are imported elsewhere (`grep -rn csv-utils src tests`), move only those into the importing module.

- [ ] **Step 1: Delete and edit as listed. Then confirm nothing still references the removed code**

Run: `grep -rniE "procountor|csv-utils|/csv|multi/zip|MILEAGE_PROCOUNTOR" src tests docs .env.example`
Expected: no matches except `docs/superpowers/` files.

- [ ] **Step 2: Verify**

Run: `pnpm typecheck && pnpm lint --fix && pnpm format && pnpm test --project=chromium`
Expected: all PASS.

- [ ] **Step 3: Check whether `@zip.js/zip.js` is still imported anywhere. If not, `pnpm remove @zip.js/zip.js`**

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove procountor csv and zip export"
```

---

### After the tasks (manual, not automated)

Before go-live, pay one test claim against `https://api-tst.nocfo.io` with a test-environment token. In NoCFO, check that the debit/credit sides and the signs come out right, that the PDF is attached, and that `GET /document/?search=` finds the `[KM:…]` marker. If search doesn't match descriptions, switch `findDocumentIdByMarker` to listing documents filtered by date.
