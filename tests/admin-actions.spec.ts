import { expect, test } from '@playwright/test'

import { loginAdmin } from './utils/admin-login'
import {
  applyArchivedFilter,
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
  })

  test('can approve a submitted entry', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRow = rowById(page, testEntryIds.submitted)
    await ensureRowExpanded(submittedRow)
    await page.getByRole('button', { name: 'Approve' }).first().click()

    const modal = page.locator('.ant-modal')
    await expect(
      modal.locator('.ant-modal-title', { hasText: 'Approve Entries' })
    ).toBeVisible()
    await modal.getByLabel('Approval Note').fill('Playwright approval')
    await modal.getByRole('button', { name: 'Approve' }).click()

    await ensureRowExpanded(submittedRow)
    await expect(statusTag(submittedRow, 'APPROVED')).toBeVisible()
  })

  test('can deny a submitted entry', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRow = rowById(page, testEntryIds.submittedSecond)
    await ensureRowExpanded(submittedRow)
    await page.getByRole('button', { name: 'Deny' }).first().click()

    await ensureRowExpanded(submittedRow)
    await expect(statusTag(submittedRow, 'DENIED')).toBeVisible()
  })

  test('can pay an approved entry', async ({ page }) => {
    await gotoAdmin(page)

    const approvedRow = rowById(page, testEntryIds.approved)
    await ensureRowExpanded(approvedRow)
    await page.getByRole('button', { name: 'Pay' }).first().click()

    const modal = page.locator('.ant-modal')
    await expect(
      modal.locator('.ant-modal-title', { hasText: 'Mark as Paid' })
    ).toBeVisible()
    await modal.getByRole('button', { name: 'Mark as Paid' }).click()

    await ensureRowExpanded(approvedRow)
    await expect(statusTag(approvedRow, 'PAID')).toBeVisible()
  })

  test('can reset a denied entry', async ({ page }) => {
    await gotoAdmin(page)

    const deniedRow = rowById(page, testEntryIds.denied)
    await ensureRowExpanded(deniedRow)
    await page.getByRole('button', { name: 'Reset' }).first().click()

    await ensureRowExpanded(deniedRow)
    await expect(statusTag(deniedRow, 'SUBMITTED')).toBeVisible()
  })

  test('can archive a paid entry', async ({ page }) => {
    await gotoAdmin(page)

    const paidRow = rowById(page, testEntryIds.paid)
    await ensureRowExpanded(paidRow)
    await page.getByRole('button', { name: 'Archive' }).first().click()

    await ensureRowExpanded(paidRow)
    await expect(statusTag(paidRow, 'PAID')).toBeVisible()

    await applyArchivedFilter(page)
    await expect(statusTag(paidRow, 'ARCHIVED')).toBeVisible()
  })

  test('shows bulk actions when multiple rows selected', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRows = page.locator(
      `tr.ant-table-row[data-row-key="${testEntryIds.submitted}"], tr.ant-table-row[data-row-key="${testEntryIds.submittedSecond}"]`
    )

    await selectRow(submittedRows.nth(0))
    await selectRow(submittedRows.nth(1))

    await expect(selectionBanner(page)).toContainText('2 entries selected')
    await expect(
      page.getByRole('button', { name: /Copy to clipboard/ })
    ).toBeVisible()
  })

  test('bulk approve selected entries', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRows = page.locator(
      `tr.ant-table-row[data-row-key="${testEntryIds.submitted}"], tr.ant-table-row[data-row-key="${testEntryIds.submittedSecond}"]`
    )

    await selectRow(submittedRows.nth(0))
    await selectRow(submittedRows.nth(1))

    await page.getByRole('button', { name: /Approve Selected/ }).click()
    const modal = page.locator('.ant-modal')
    await expect(
      modal.locator('.ant-modal-title', { hasText: 'Approve Entries' })
    ).toBeVisible()
    await modal.getByLabel('Approval Note').fill('Bulk approval')
    await modal.getByRole('button', { name: 'Approve' }).click()

    await gotoAdmin(page)
    await expect(
      statusTag(rowById(page, testEntryIds.submitted), 'APPROVED')
    ).toBeVisible()
    await expect(
      statusTag(rowById(page, testEntryIds.submittedSecond), 'APPROVED')
    ).toBeVisible()
  })

  test('disables mixed-status selections', async ({ page }) => {
    await gotoAdmin(page)

    const submittedRow = rowById(page, testEntryIds.submitted)
    await selectRow(submittedRow)

    const approvedRowCheckbox = rowById(page, testEntryIds.approved).locator(
      '.ant-checkbox-input'
    )
    await expect(approvedRowCheckbox).toBeDisabled()
  })
})
