import { expect, test } from '@playwright/test'

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
import { testEntryIds } from './utils/test-data'

test.describe('admin actions', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData()
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

  test('copy to clipboard copies selected entry text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
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
