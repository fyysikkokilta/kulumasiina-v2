import type { Page } from '@playwright/test'

export type AddMinimalMileageOverrides = Partial<{
  name: string
  contact: string
  iban: string
  title: string
  govId: string
}>

export async function addMinimalMileageAndFillCommon(
  page: Page,
  overrides: AddMinimalMileageOverrides = {}
) {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('1')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await page.getByLabel('Payee Name').fill(overrides.name ?? 'Test Payee')
  await page.getByLabel('Contact Information').fill(overrides.contact ?? 'test@example.com')
  await page.getByLabel('IBAN').fill(overrides.iban ?? 'FI2112345600000785')
  await page.getByLabel('Claim Title').fill(overrides.title ?? 'Expenses')
  await page.getByLabel('Personal ID Code').fill(overrides.govId ?? '010190-123A')
}
