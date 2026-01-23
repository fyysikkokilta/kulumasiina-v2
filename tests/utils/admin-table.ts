import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const gotoAdmin = async (page: Page) => {
  await page.goto('/admin')
  await expect(page.locator('.ant-table')).toBeVisible()
}

export const rowById = (page: Page, entryId: string) =>
  page.locator(`tr.ant-table-row[data-row-key="${entryId}"]`)

export const ensureRowExpanded = async (row: Locator) => {
  const toggle = row.locator('.ant-table-row-expand-icon')
  const classes = (await toggle.getAttribute('class')) || ''
  if (classes.includes('ant-table-row-expand-icon-collapsed')) {
    await toggle.click()
  }
}

export const statusTag = (row: Locator, text: string) =>
  row.locator('td .ant-tag').filter({ hasText: text })

export const selectRow = async (row: Locator) => {
  await row.locator('.ant-checkbox-input').click()
}

export const selectionBanner = (page: Page) =>
  page.locator('.rounded-md.border.border-blue-200.bg-blue-50')

export const applyArchivedFilter = async (page: Page) => {
  const archivedColumn = page.locator('th').filter({ hasText: 'Archived' })
  await archivedColumn.locator('.ant-table-filter-trigger').click()
  const filterDropdown = page.locator('.ant-table-filter-dropdown')
  await filterDropdown.getByText('ARCHIVED', { exact: true }).click()
  await filterDropdown.getByText('OK', { exact: true }).click()
}
