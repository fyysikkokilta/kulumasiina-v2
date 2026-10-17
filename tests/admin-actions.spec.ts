import { expect, test, type Page } from '@playwright/test'

import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { entry, item } from '@/db/schema'

import { loginAdmin } from './utils/admin-login'
import {
  applyArchivedFilter,
  applyStatusFilter,
  ensureRowExpanded,
  gotoAdmin,
  rowById,
  selectionBanner,
  selectRow,
  statusTag
} from './utils/admin-table'
import { seedTestData } from './utils/seed'
import { testEntryIds, testItemIds } from './utils/test-data'

const NOCFO = 'http://localhost:55433'

type NocfoRequest = {
  method: string
  path: string
  headers: Record<string, string>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
}

const nocfoRequests = async (): Promise<NocfoRequest[]> =>
  (await fetch(`${NOCFO}/__requests`)).json()

const openPayModal = async (page: Page) => {
  const approvedRow = rowById(page, testEntryIds.approved)
  await ensureRowExpanded(approvedRow)
  await page.getByRole('button', { name: 'Pay' }).first().click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Payment Date').fill('2025-01-15')
  return { approvedRow, modal }
}

test.describe('admin actions', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData()
    await fetch(`${NOCFO}/__reset`, { method: 'POST' })
    await loginAdmin(page)
    await gotoAdmin(page)
  })

  test('can approve a submitted entry', async ({ page }) => {
    const submittedRow = rowById(page, testEntryIds.submitted)
    await ensureRowExpanded(submittedRow)
    await page.getByRole('button', { name: 'Approve' }).first().click()

    const modal = page.getByRole('dialog')
    await expect(modal.getByRole('heading', { name: 'Approve Entries' })).toBeVisible()
    await modal.getByLabel('Approval Date').fill('2025-01-15')
    await modal.getByLabel('Approval Note').fill('Playwright approval')
    await modal.getByRole('button', { name: 'Approve' }).click()

    await ensureRowExpanded(submittedRow)
    await expect(statusTag(submittedRow, 'APPROVED')).toBeVisible()
  })

  test('can deny a submitted entry', async ({ page }) => {
    const submittedRow = rowById(page, testEntryIds.submittedSecond)
    await ensureRowExpanded(submittedRow)
    await page.getByRole('button', { name: 'Deny' }).first().click()

    await ensureRowExpanded(submittedRow)
    await expect(statusTag(submittedRow, 'DENIED')).toBeVisible()
  })

  test('can pay an approved entry', async ({ page }) => {
    const approvedRow = rowById(page, testEntryIds.approved)
    await ensureRowExpanded(approvedRow)
    await page.getByRole('button', { name: 'Pay' }).first().click()

    const modal = page.getByRole('dialog')
    await expect(modal.getByRole('heading', { name: 'Mark as Paid' })).toBeVisible()
    await modal.getByLabel('Payment Date').fill('2025-01-15')
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()

    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'PAID')).toBeVisible()
  })

  test('pay sends one nocfo document per payee with pdf attached', async ({ page }) => {
    const { approvedRow, modal } = await openPayModal(page)
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'PAID')).toBeVisible()

    const reqs = await nocfoRequests()
    expect(reqs.filter((r) => r.path.endsWith('/file_upload/'))).toHaveLength(1)
    const docs = reqs.filter((r) => r.method === 'POST' && r.path.endsWith('/document/'))
    expect(docs).toHaveLength(1)
    expect(docs[0].body.blueprint.credit_entries[0].account_id).toBe(99)
    expect(docs[0].headers['idempotency-key']).toBeTruthy()
  })

  test('pay without nocfo only marks paid', async ({ page }) => {
    const { approvedRow, modal } = await openPayModal(page)
    await modal.getByRole('checkbox', { name: 'Send to NoCFO' }).click()
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'PAID')).toBeVisible()
    expect((await nocfoRequests()).length).toBe(0)
  })

  test('failed nocfo send leaves entry approved and shows the failure', async ({ page }) => {
    await fetch(`${NOCFO}/__fail-next-document`, { method: 'POST' })
    const { approvedRow, modal } = await openPayModal(page)
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await expect(modal).toContainText('Not sent to NoCFO')
    await modal.getByRole('button', { name: 'Cancel' }).click()
    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'APPROVED')).toBeVisible()
  })

  test('retry after lost response reuses existing nocfo document', async ({ page }) => {
    await fetch(`${NOCFO}/v1/business/test-guild/document/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: `Earlier [KM:${testEntryIds.approved.slice(0, 8)}]` })
    })
    await fetch(`${NOCFO}/__clear-requests`, { method: 'POST' })

    const { approvedRow, modal } = await openPayModal(page)
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'PAID')).toBeVisible()
    const docs = (await nocfoRequests()).filter(
      (r) => r.method === 'POST' && r.path.endsWith('/document/')
    )
    expect(docs).toHaveLength(0)
  })

  test('entry already sent with a different selection fails and names the document', async ({
    page
  }) => {
    const res = await fetch(`${NOCFO}/v1/business/test-guild/document/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: `Earlier [KM:${testEntryIds.approved.slice(0, 8)},deadbeef]`
      })
    })
    const { id } = (await res.json()) as { id: number }
    await fetch(`${NOCFO}/__clear-requests`, { method: 'POST' })

    const { approvedRow, modal } = await openPayModal(page)
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await expect(modal).toContainText(`Already in NoCFO document ${id}`)
    const docs = (await nocfoRequests()).filter(
      (r) => r.method === 'POST' && r.path.endsWith('/document/')
    )
    expect(docs).toHaveLength(0)
    await modal.getByRole('button', { name: 'Cancel' }).click()
    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'APPROVED')).toBeVisible()
  })

  test('pressing pay again after a partial failure retries only the failed payee', async ({
    page
  }) => {
    // A second approved entry with another payee; approved through the UI so the table refreshes
    await db
      .update(entry)
      .set({ iban: 'FI4950009420028730' })
      .where(eq(entry.id, testEntryIds.submittedSecond))
    await db.update(item).set({ account: '4205' }).where(eq(item.id, testItemIds.submittedSecond))
    const secondRow = rowById(page, testEntryIds.submittedSecond)
    await ensureRowExpanded(secondRow)
    await page.getByRole('button', { name: 'Approve', exact: true }).first().click()
    const approveModal = page.getByRole('dialog')
    await approveModal.getByLabel('Approval Date').fill('2025-01-15')
    await approveModal.getByLabel('Approval Note').fill('Second payee')
    await approveModal.getByRole('button', { name: 'Approve' }).click()
    await expect(approveModal).toBeHidden()
    await expect(statusTag(secondRow, 'APPROVED')).toBeVisible()

    await selectRow(rowById(page, testEntryIds.approved))
    await selectRow(secondRow)
    await page.getByRole('button', { name: 'Mark as Paid' }).click()
    const modal = page.getByRole('dialog')
    await modal.getByLabel('Payment Date').fill('2025-01-15')

    await fetch(`${NOCFO}/__fail-next-document`, { method: 'POST' })
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await expect(modal).toContainText('Not sent to NoCFO')
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await expect(modal).toBeHidden()

    for (const id of [testEntryIds.approved, testEntryIds.submittedSecond]) {
      const row = rowById(page, id)
      await ensureRowExpanded(row)
      await expect(statusTag(row, 'PAID')).toBeVisible()
    }
  })

  test('unknown account fails the entry and names the account', async ({ page }) => {
    await db.update(item).set({ account: '9999' }).where(eq(item.id, testItemIds.approved))
    const { approvedRow, modal } = await openPayModal(page)
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await expect(modal).toContainText('9999')
    await modal.getByRole('button', { name: 'Cancel' }).click()
    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'APPROVED')).toBeVisible()
  })

  test('paying an already paid entry shows an error and does not call nocfo', async ({ page }) => {
    const { modal } = await openPayModal(page)
    await db.update(entry).set({ status: 'paid' }).where(eq(entry.id, testEntryIds.approved))
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()
    await expect(modal).toContainText('Approved entry')
    expect(await nocfoRequests()).toHaveLength(0)
  })

  test('can reset a denied entry', async ({ page }) => {
    const deniedRow = rowById(page, testEntryIds.denied)
    await ensureRowExpanded(deniedRow)
    await page.getByRole('button', { name: 'Reset' }).first().click()

    await ensureRowExpanded(deniedRow)
    await expect(statusTag(deniedRow, 'SUBMITTED')).toBeVisible()
  })

  test('can archive a paid entry', async ({ page }) => {
    const paidRow = rowById(page, testEntryIds.paid)
    await ensureRowExpanded(paidRow)
    await page.getByRole('button', { name: 'Archive', exact: true }).first().click()

    await expect(statusTag(paidRow, 'PAID')).not.toBeVisible()

    await applyArchivedFilter(page)
    await ensureRowExpanded(paidRow)
    await expect(statusTag(paidRow, 'PAID')).toBeVisible()
    await expect(statusTag(paidRow, 'ARCHIVED')).toBeVisible()
  })

  test('shows bulk actions when multiple rows selected', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRows = page.locator(
      `tr[data-row-key="${testEntryIds.submitted}"], tr[data-row-key="${testEntryIds.submittedSecond}"]`
    )

    await selectRow(submittedRows.nth(0))
    await selectRow(submittedRows.nth(1))

    await expect(selectionBanner(page)).toContainText('2 entries selected')
    await expect(page.getByRole('button', { name: /Copy to clipboard/ })).toBeVisible()
  })

  test('bulk approve selected entries', async ({ page }) => {
    const submittedRows = page.locator(
      `tr[data-row-key="${testEntryIds.submitted}"], tr[data-row-key="${testEntryIds.submittedSecond}"]`
    )

    await selectRow(submittedRows.nth(0))
    await selectRow(submittedRows.nth(1))

    await page.getByRole('button', { name: /Approve Selected/ }).click()
    const modal = page.getByRole('dialog')
    await expect(modal.getByRole('heading', { name: 'Approve Entries' })).toBeVisible()
    await modal.getByLabel('Approval Date').fill('2025-01-15')
    await modal.getByLabel('Approval Note').fill('Bulk approval')
    await modal.getByRole('button', { name: 'Approve' }).click()
    await expect(modal).toBeHidden()

    await gotoAdmin(page)
    await expect(statusTag(rowById(page, testEntryIds.submitted), 'APPROVED')).toBeVisible()
    await expect(statusTag(rowById(page, testEntryIds.submittedSecond), 'APPROVED')).toBeVisible()
  })

  test('disables mixed-status selections', async ({ page }) => {
    const submittedRow = rowById(page, testEntryIds.submitted)
    await selectRow(submittedRow)

    const approvedRowCheckbox = rowById(page, testEntryIds.approved).getByRole('checkbox').first()
    await expect(approvedRowCheckbox).toBeDisabled()
  })

  test('copy to clipboard copies selected entry text', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRow = rowById(page, testEntryIds.submitted)
    await selectRow(submittedRow)
    await page.getByRole('button', { name: /Copy to clipboard/ }).click()

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toContain('Test Submitted')
    expect(clipboardText).toContain('Submitted entry')
  })

  test('filter by status shows only matching rows', async ({ page }) => {
    await applyStatusFilter(page, 'Submitted')

    await expect(rowById(page, testEntryIds.approved)).not.toBeVisible()

    await expect(rowById(page, testEntryIds.submitted)).toBeVisible()
    await expect(rowById(page, testEntryIds.submittedSecond)).toBeVisible()
  })

  test('approve modal shows validation when approval note is empty', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRow = rowById(page, testEntryIds.submitted)
    await ensureRowExpanded(submittedRow)
    await page.getByRole('button', { name: 'Approve' }).first().click()

    const modal = page.getByRole('dialog')
    await expect(modal.getByRole('heading', { name: 'Approve Entries' })).toBeVisible()
    await modal.getByRole('button', { name: 'Approve' }).click()

    await expect(modal.getByText(/Please enter approval note|approval note/)).toBeVisible()
  })

  test('clear filters button appears when filters are applied', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Reset' })).not.toBeVisible()

    await applyStatusFilter(page, 'Submitted')
    // Wait for filter popover to close
    await expect(page.getByRole('button', { name: 'OK' })).not.toBeVisible()

    await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible()
  })
})
