import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export const gotoAdmin = async (page: Page) => {
  await page.goto('/admin')
  await expect(
    page
      .locator('table')
      .filter({ has: page.locator('tbody tr[data-row-key]') })
  ).toBeVisible()
}

export const rowById = (page: Page, entryId: string) =>
  page.locator(`tr[data-row-key="${entryId}"]`)

export const ensureRowExpanded = async (row: Locator) => {
  const toggle = row.locator('button[aria-expanded]')
  const isExpanded = (await toggle.getAttribute('aria-expanded')) === 'true'
  if (!isExpanded) {
    await toggle.click()
  }
}

export const statusTag = (row: Locator, text: string) =>
  row.locator('td span').filter({ hasText: text })

export const selectRow = async (row: Locator) => {
  await row.getByRole('checkbox').first().click()
}

export const selectionBanner = (page: Page) =>
  page.getByText(/entries selected/i).first()

export const applyArchivedFilter = async (page: Page) => {
  const archivedHeader = page.locator('th').filter({ hasText: 'Archived' })
  await archivedHeader.getByRole('button').click()

  const portal = page.locator('div[role="presentation"]')
  await portal.getByRole('checkbox', { name: 'Active' }).click()
  await portal.getByRole('checkbox', { name: 'Archived' }).click()
  await portal.getByRole('button', { name: 'OK' }).click()
}

export const applyStatusFilter = async (page: Page, optionLabel: string) => {
  const statusHeader = page.locator('th').filter({ hasText: 'Status' })
  await statusHeader.getByRole('button', { name: 'Filter' }).click()

  const portal = page.locator('div[role="presentation"]')
  await portal.getByRole('checkbox', { name: optionLabel }).click()
  await portal.getByRole('button', { name: 'OK' }).click()
}
