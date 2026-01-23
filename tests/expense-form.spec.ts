import { expect, test } from '@playwright/test'

const samplePdfBase64 =
  'JVBERi0xLjUKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDIwMCAyMDBdIC9Db250ZW50cyA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDQ0ID4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDEwMCBUZAooVGVzdCByZWNlaXB0KSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA4MCAwMDAwMCBuIAowMDAwMDAwMTUyIDAwMDAwIG4gCjAwMDAwMDAyNTkgMDAwMDAgbiAKMDAwMDAwMDM0NiAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ1NQolJUVPRgo='

test('can add a mileage entry and shows total', async ({ page }) => {
  await page.goto('/en')

  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled()

  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.locator('.ant-modal')

  await modal.getByLabel('Description').fill('Board meeting travel')
  await modal.locator('.ant-picker-input input').fill('01.01.2025')
  await modal.getByLabel('Route').fill('Campus - Guild room')
  await modal.getByLabel('Distance').fill('10')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  const mileageCard = page.locator('.ant-card').filter({ hasText: 'Mileage' })
  await expect(mileageCard.first()).toBeVisible()
  await expect(page.getByText('Route:')).toBeVisible()
  await expect(page.getByText('ABC-123')).toBeVisible()
  await expect(
    mileageCard.locator('.ant-tag').filter({ hasText: '2.50 €' })
  ).toBeVisible()
  await expect(page.getByLabel('Personal ID Code')).toBeVisible()
})

test('can add an expense item with an attachment', async ({ page }) => {
  await page.goto('/en')

  await page.getByRole('button', { name: 'Expense' }).click()
  const modal = page.locator('.ant-modal')

  await modal.getByLabel('Description').fill('Office supplies')
  await modal.locator('.ant-picker-input input').fill('02.01.2025')

  const fileInput = modal.locator('input[type="file"]')
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/attachment') && res.ok()
    ),
    fileInput.setInputFiles({
      name: 'receipt.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(samplePdfBase64, 'base64')
    })
  ])

  const valueInput = modal.locator('input[role="spinbutton"]')
  await expect(valueInput).toHaveCount(1)
  await valueInput.fill('12.50')
  await modal.getByRole('button', { name: 'OK' }).click()

  const expenseCard = page
    .locator('.ant-card')
    .filter({ hasText: 'Expense item' })
  await expect(expenseCard).toBeVisible()
  await expect(expenseCard.getByText('1 attachment')).toBeVisible()
  await expect(
    expenseCard.locator('.ant-tag').filter({ hasText: '12.50 €' })
  ).toBeVisible()
})

test('shows validation errors for invalid IBAN', async ({ page }) => {
  await page.goto('/en')

  await page.getByLabel('Payee Name').fill('Carl Compensator')
  await page.getByLabel('Contact Information').fill('carl@example.com')
  await page.getByLabel('IBAN').fill('FI00')
  await page.getByLabel('Claim Title').fill('Office expenses')

  await page.getByLabel('IBAN').blur()
  await expect(page.getByText('Invalid IBAN format!')).toBeVisible()
})

test('requires personal id code when mileage exists', async ({ page }) => {
  await page.goto('/en')

  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.locator('.ant-modal')

  await modal.getByLabel('Description').fill('Trip')
  await modal.locator('.ant-picker-input input').fill('03.01.2025')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('5')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(
    page.getByText(
      'Government issued personal identification code is required for paying mileages!'
    )
  ).toBeVisible()
})

test('blocks submitting item without attachment value', async ({ page }) => {
  await page.goto('/en')

  await page.getByRole('button', { name: 'Expense' }).click()
  const modal = page.locator('.ant-modal')

  await modal.getByLabel('Description').fill('Stationery')
  await modal.locator('.ant-picker-input input').fill('04.01.2025')

  const fileInput = modal.locator('input[type="file"]')
  await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/api/attachment') && res.ok()
    ),
    fileInput.setInputFiles({
      name: 'receipt.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(samplePdfBase64, 'base64')
    })
  ])

  await modal.getByRole('button', { name: 'OK' }).click()
  await expect(modal.getByText('Please provide the price!')).toBeVisible()
})
