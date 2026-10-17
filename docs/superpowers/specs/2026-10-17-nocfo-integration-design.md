# NoCFO integration (replaces Procountor export)

## Intent

The guild is moving its bookkeeping from Procountor to NoCFO. Today the treasurer
approves and pays claims in Kulumasiina, then downloads a ZIP (Procountor-format
CSV + one PDF per payee) and imports it into Procountor, which books the claim,
pays the person and matches the bank payment. Nobody touches Kulumasiina after that.

The new flow keeps the same shape, without the file in the middle: when the
treasurer presses **Pay**, Kulumasiina sends the claims to NoCFO through its API.
Everything after that (paying the person from the bank, matching the bank line)
happens in NoCFO. The guild's bank is already connected to NoCFO.

## Goals

- Pressing **Pay** creates the bookkeeping documents (tositteet) in NoCFO, with
  receipt PDFs attached, without any manual file handling.
- Claims paid in the same Pay click are combined per payee: one NoCFO document
  per payee (same IBAN, and same henkilötunnus if present), same merge rule as
  `mergeCsvInfos` in `src/utils/csv-utils.ts` today. This keeps NoCFO's
  per-transaction billing count down (plans are priced by monthly transactions;
  see Open risks).
- The books stay correct no matter how the treasurer actually pays (one bank
  transfer per payee, one per claim, or several payees at once).

## Non-goals

- Kulumasiina does not pay anyone or talk to the bank.
- No NoCFO contacts, tags, or purchase-invoice objects. A plain document is enough.
- No email-based sending (NoCFO has no documented receipt inbox; the API is better).
- No admin UI for NoCFO settings; configuration is environment variables.
- No Tulorekisteri (Incomes Register) reporting. Procountor used to report
  kilometrikorvaus there from the travel-invoice CSV rows. NoCFO's API has no
  payroll/Tulorekisteri endpoints, so the treasurer files it in NoCFO's own UI
  (payroll), outside this app. No mileage report download is added.

## Anti-goals

- Double-booking: the same money must not leave the bank twice in the books
  (once from Kulumasiina, once from NoCFO's bank feed).
- Duplicate NoCFO documents from retries or double clicks.
- An entry marked `paid` in Kulumasiina that never reached NoCFO, silently.

## Accounting model (decided)

Each NoCFO document books the cost against a debt to the payee, never against
the bank:

- **Debit:** one entry per expense item / mileage row, on the bookkeeping account
  already chosen in Kulumasiina (`item.account`, `mileage.account`), VAT 0 (as the
  Procountor CSV does today).
- **Credit:** the total, on the bank account configured by `NOCFO_BANK_ACCOUNT`
  (default `1910`, decided by the user; 1910 is the bank account in NoCFO's
  default chart of accounts).

The bank line that NoCFO imports later is matched by the treasurer to this
document in NoCFO, not booked a second time. (Earlier drafts credited a payable
account instead; the user chose the bank account.)

## Behaviour

### Pay

`payEntriesAction` (`src/lib/actions/payEntries.ts`) changes from "mark as paid"
to "send to NoCFO, then mark as paid":

1. Load the selected entries (must all be `approved`) with items, attachments and
   mileages.
2. Validate up front, before any NoCFO call: every item and mileage row has an
   account. If not, fail the whole action with a clear, translated error naming the
   entry. (Today's CSV tolerates a missing account; NoCFO can't.)
3. Group entries per payee (IBAN + govId, whitespace-insensitive).
4. For each group:
   1. Generate each entry's PDF with the existing `generateCombinedPDF` (status
      `paid`, paid date = date from the Pay modal) and upload it
      (`POST /v1/business/{slug}/file_upload/`).
   2. Duplicate guard (Claude's call): before uploading anything, search NoCFO
      documents (`GET /v1/business/{slug}/document/?search=`) for a marker
      `[KM:<first 8 chars of each entry ID, sorted>]` embedded in the description.
      If found, skip creation and just save that document ID locally (step 3).
      This covers "document created but DB update failed / response lost", where
      an `Idempotency-Key` alone would 422 because re-uploaded files change the body.
   3. Generate each entry's PDF with the existing `generateCombinedPDF` (status
      `paid`, paid date = date from the Pay modal) and upload it
      (`POST /v1/business/{slug}/file_upload/`).
   4. Create the document (`POST /v1/business/{slug}/document/`): date = paid date,
      description like `Kulukorvaus: <name> – <entry titles> [KM:…]`,
      `attachment_ids` = uploaded files, `blueprint` per the accounting model above,
      `is_draft: false` (Claude's call: the treasurer already reviewed the claim in
      Kulumasiina; flip to drafts if they want a second check in NoCFO).
   5. On success, in one DB update set those entries to `paid`, `paidDate`, and the
      new column `nocfoDocumentId`.
5. The PayModal gets a **"Send to NoCFO"** checkbox, on by default (Claude's call).
   Unchecked = old behaviour (just mark paid). Covers cutover (claims already
   handled in Procountor), NoCFO outages, and claims settled some other way.
6. Groups are independent. If one fails, the others still go through. Failed
   entries stay `approved`; the action returns which entries failed and why, and
   the PayModal shows it. Pressing Pay again on them retries.

An `Idempotency-Key` header (sorted entry IDs + paid date) is still sent on the
document POST as a second guard against double clicks; the marker search is the
primary one.

Errors are logged server-side with full context (status, NoCFO response body);
the UI gets a short translated message.

### Mapping details

- Amounts are sent in cents (`Math.round(euros * 100)`). Expense item amount =
  sum of its non-`isNotReceipt` attachment values (same as the CSV today). Mileage
  amount = `distance * NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE`.
- Kulumasiina stores account _numbers_ (e.g. `4205`); NoCFO wants account _IDs_.
  Look them up with `GET /v1/business/{slug}/account/?number=<n>` once per Pay
  action. Unknown number → that group fails with an error naming the account.
- Entry descriptions are truncated sensibly for NoCFO limits if any.

### Removed

- Procountor CSV/ZIP export: `src/utils/csv-utils.ts` (keep only helpers still
  used elsewhere), `src/app/api/entry/[id]/csv`, `src/app/api/entry/multi/zip`,
  the CSV/ZIP buttons in `AdminEntryTableColumns.tsx` / `AdminEntryTable.tsx`, the
  matching `ExportPage` allow-list patterns, `MILEAGE_PROCOUNTOR_PRODUCT_ID`
  (env.ts, .env.example), and their tests.
- Procountor wording in i18n (e.g. `DeleteOldArchivedModal.text_2`) is updated to
  refer to NoCFO.

### Kept

- The per-entry PDF export (`src/app/api/entry/[id]/pdf`) stays unchanged.
- The "minutes export" the user mentioned lives outside this app and is out of scope.

## Configuration

New server env vars in `src/lib/env.ts` and `.env.example`:

| Var                   | Purpose                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NOCFO_API_URL`       | Default `https://api.nocfo.io`; `https://api-tst.nocfo.io` for testing                                                                                                       |
| `NOCFO_API_TOKEN`     | Personal Access Token (`Authorization: Token <pat>`), created at login.nocfo.io/auth/tokens/. Actions are attributed to the token's user, so ideally a treasurer account.    |
| `NOCFO_BUSINESS_SLUG` | The guild's business slug in NoCFO                                                                                                                                           |
| `NOCFO_BANK_ACCOUNT`  | Account number for the credit (bank) side. Default `1910`. An account number NoCFO doesn't know makes Pay (with "Send to NoCFO") fail with a clear error naming the account. |

## Data model

Add nullable `nocfoDocumentId` (integer) to `entry`, with a Drizzle migration.
It records which NoCFO document an entry went into and could be shown in the admin
expanded row. `resetEntries` should clear it. Resetting does not delete the NoCFO
document; the treasurer handles that in NoCFO.

## Testing

- Pure logic (grouping, amount/cents mapping, blueprint building) gets `@node`
  unit tests.
- Pay-flow Playwright tests must not hit real NoCFO. Point `NOCFO_API_URL` at a
  small fake server started by the test setup, and assert on the requests it
  receives (one document per payee, attachments uploaded, idempotency key sent,
  partial-failure behaviour).
- Manual verification against `api-tst.nocfo.io` before release.

## Left to the builder

- Module layout for the NoCFO client (a single small `src/lib/nocfo.ts` is
  expected; no abstraction layer).
- Exact description text and length handling.
- How the fake NoCFO server is wired into the Playwright setup.
- Whether PDF generation/upload per group runs sequentially or in parallel
  (sequential is fine at guild volume).

## Open risks

- NoCFO's pricing page doesn't define what counts as a "transaction". It's likely
  one document or bank line each. Worth confirming with NoCFO support. Grouping
  per payee already minimises the count.
- With the bank account on the credit side, the treasurer must match each imported
  bank line to the app's document in NoCFO rather than booking it again, or the
  payment is counted twice. Verify in the NoCFO testing environment that bank
  transactions can be linked to an existing document crediting 1910.
- Mileage may be double-booked if NoCFO's payroll also creates bookkeeping
  entries when the treasurer reports kilometrikorvaus to Tulorekisteri there.
  Confirm with NoCFO support / the treasurer before go-live. If it does, the app
  should stop including mileage rows in the documents (small change in the
  blueprint builder; PDFs still attach).
- `NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE` must stay at or below the tax-free
  rate (0.55 €/km in 2026), or the excess is taxable salary.
- Claims already handled in Procountor but still `approved` at cutover must be
  paid with "Send to NoCFO" unticked.
- The blueprint sign and debit/credit conventions are only documented in the API
  schema. Verify the produced entries in the NoCFO testing environment before
  going live.
