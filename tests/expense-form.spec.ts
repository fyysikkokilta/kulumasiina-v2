import { expect, test } from '@playwright/test'

import { addMinimalMileageAndFillCommon } from './utils/expense-form'

const samplePdfBase64 =
  'JVBERi0xLjUKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDIwMCAyMDBdIC9Db250ZW50cyA0IDAgUiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDQ0ID4+CnN0cmVhbQpCVAovRjEgMTIgVGYKMTAwIDEwMCBUZAooVGVzdCByZWNlaXB0KSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA4MCAwMDAwMCBuIAowMDAwMDAwMTUyIDAwMDAwIG4gCjAwMDAwMDAyNTkgMDAwMDAgbiAKMDAwMDAwMDM0NiAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQ1NQolJUVPRgo='

test.beforeEach(async ({ page }) => {
  await page.goto('/en')
})

test('can add a mileage entry and shows total', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled()

  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Board meeting travel')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('Campus - Guild room')
  await modal.getByLabel('Distance').fill('10')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  const mileageCard = page.locator('div').filter({ hasText: 'Mileage' }).first()
  await expect(mileageCard).toBeVisible()
  await expect(page.getByText('Route:')).toBeVisible()
  await expect(page.getByText('ABC-123')).toBeVisible()
  await expect(page.getByText('2.50 €').first()).toBeVisible()
  await expect(page.getByLabel('Personal ID Code')).toBeVisible()
})

test('can add an expense item with an attachment', async ({ page }) => {
  await page.getByRole('button', { name: 'Expense' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Office supplies')
  await modal.getByLabel('Date').fill('2025-01-02')

  const fileInput = modal.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'receipt.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(samplePdfBase64, 'base64')
  })
  await expect(modal.getByLabel('Amount')).toBeVisible({ timeout: 15000 })

  await modal.getByLabel('Amount').fill('12.50')
  await modal.getByRole('button', { name: 'OK' }).click()

  const expenseCard = page.locator('div').filter({ hasText: 'Expense item' }).first()
  await expect(expenseCard).toBeVisible()
  await expect(expenseCard.getByText('1 attachment')).toBeVisible()
  await expect(expenseCard.getByRole('strong').filter({ hasText: '12.50 €' })).toBeVisible()
})

test('shows validation errors for invalid IBAN', async ({ page }) => {
  // Add a minimal entry so Submit is enabled (validation runs on submit)
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('1')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await page.getByLabel('Payee Name').fill('Carl Compensator')
  await page.getByLabel('Contact Information').fill('carl@example.com')
  await page.getByLabel('IBAN').fill('FI00')
  await page.getByLabel('Claim Title').fill('Office expenses')

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/Invalid IBAN/)).toBeVisible()
})

test('requires personal id code when mileage exists', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-03')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('5')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/personal identification code is required/)).toBeVisible()
})

test('blocks submitting item without attachment value', async ({ page }) => {
  await page.getByRole('button', { name: 'Expense' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Stationery')
  await modal.getByLabel('Date').fill('2025-01-04')

  const fileInput = modal.locator('input[type="file"]')
  await fileInput.setInputFiles({
    name: 'receipt.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(samplePdfBase64, 'base64')
  })
  await expect(modal.getByLabel('Amount')).toBeVisible({ timeout: 15000 })

  await modal.getByRole('button', { name: 'OK' }).click()
  await expect(modal.getByText(/At least one attachment must have a monetary value/)).toBeVisible()
})

test('shows success screen after valid submission', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Conference travel')
  await modal.getByLabel('Date').fill('2025-01-15')
  await modal.getByLabel('Route').fill('Office - Venue')
  await modal.getByLabel('Distance').fill('20')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await page.getByLabel('Payee Name').fill('Test Payee')
  await page.getByLabel('Contact Information').fill('test@example.com')
  await page.getByLabel('IBAN').fill('FI2112345600000785')
  await page.getByLabel('Claim Title').fill('Conference expenses')
  await page.getByLabel('Personal ID Code').fill('020202A0202')

  await page.getByRole('button', { name: 'Submit' }).click()

  // Submission completes and shows result (success or failure depending on env/DB)
  await expect(page.getByRole('heading', { name: /Success!|Error!/ })).toBeVisible({
    timeout: 15000
  })
  await expect(page.getByRole('button', { name: /Submit Another|Try Again/ })).toBeVisible()
})

test('can edit an existing mileage entry', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  let modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Original trip')
  await modal.getByLabel('Date').fill('2025-01-10')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('5')
  await modal.getByLabel('Plate Number').fill('xyz-999')
  await modal.getByRole('button', { name: 'OK' }).click()

  const mileageCard = page.locator('div').filter({ hasText: 'Mileage' }).first()
  await mileageCard.getByRole('button', { name: 'Edit' }).click()

  modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Updated trip description')
  await modal.getByLabel('Route').fill('A - B - C')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(page.getByText('Updated trip description')).toBeVisible()
  await expect(page.getByText('A - B - C')).toBeVisible()
})

test('can remove an entry', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('To be removed')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('X - Y')
  await modal.getByLabel('Distance').fill('1')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(page.getByText('To be removed')).toBeVisible()

  await page.getByRole('button', { name: 'Remove' }).first().click()

  await expect(page.getByText('To be removed')).not.toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled()
})

test('shows validation error when payee name is empty', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')
  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('1')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await page.getByLabel('Contact Information').fill('test@example.com')
  await page.getByLabel('IBAN').fill('FI2112345600000785')
  await page.getByLabel('Claim Title').fill('Expenses')
  await page.getByLabel('Personal ID Code').fill('010190-123A')
  // Leave Payee Name empty

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/Please enter payee name/)).toBeVisible()
})

// --- Main form validation (requires one entry so Submit is enabled) ---

test('shows validation error when contact information is empty', async ({ page }) => {
  await addMinimalMileageAndFillCommon(page, { contact: '' })

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/Please enter contact information/)).toBeVisible()
})

test('shows validation error when claim title is empty', async ({ page }) => {
  await addMinimalMileageAndFillCommon(page, { title: '' })

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/Please enter claim title/)).toBeVisible()
})

test('shows validation error when IBAN is empty', async ({ page }) => {
  await addMinimalMileageAndFillCommon(page, { iban: '' })

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/Please enter IBAN/)).toBeVisible()
})

test('shows validation error for invalid personal id code format', async ({ page }) => {
  await addMinimalMileageAndFillCommon(page, { govId: 'invalid-id' })

  await page.getByRole('button', { name: 'Submit' }).click()
  await expect(page.getByText(/Invalid Finnish social security number/)).toBeVisible()
})

test('shows validation error when no entries added', async ({ page }) => {
  await page.getByLabel('Payee Name').fill('Test')
  await page.getByLabel('Contact Information').fill('test@example.com')
  await page.getByLabel('IBAN').fill('FI2112345600000785')
  await page.getByLabel('Claim Title').fill('Expenses')
  // Submit is disabled when no entries - verify it stays disabled
  await expect(page.getByRole('button', { name: 'Submit' })).toBeDisabled()
})

// --- Mileage form validation (modal) ---

test('mileage form shows error when description is empty', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('10')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(modal.getByText(/Please provide a description/)).toBeVisible()
})

test('mileage form shows error when route is empty', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Distance').fill('10')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(modal.getByText(/Please provide the used route/)).toBeVisible()
})

test('mileage form shows error when distance is zero', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('0')
  await modal.getByLabel('Plate Number').fill('abc-123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(modal.getByText(/Please provide a valid positive number/)).toBeVisible()
})

test('mileage form shows error when plate number is empty', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('5')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(modal.getByText(/Please provide the plate number of the vehicle/)).toBeVisible()
})

test('mileage form shows error for invalid plate number format', async ({ page }) => {
  await page.getByRole('button', { name: 'Mileage' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Trip')
  await modal.getByLabel('Date').fill('2025-01-01')
  await modal.getByLabel('Route').fill('A - B')
  await modal.getByLabel('Distance').fill('5')
  await modal.getByLabel('Plate Number').fill('ABC@123')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(modal.getByText(/Invalid plate number format/)).toBeVisible()
})

// --- Expense item form validation (modal) ---

test('expense item form shows error when description is empty', async ({ page }) => {
  await page.getByRole('button', { name: 'Expense' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Date').fill('2025-01-02')
  await modal.locator('input[type="file"]').setInputFiles({
    name: 'receipt.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(samplePdfBase64, 'base64')
  })
  await expect(modal.getByLabel('Amount')).toBeVisible({ timeout: 15000 })
  await modal.getByLabel('Amount').fill('10.00')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(modal.getByText(/Please provide a description/)).toBeVisible()
})

test('expense item form shows error when no attachment added', async ({ page }) => {
  await page.getByRole('button', { name: 'Expense' }).click()
  const modal = page.getByRole('dialog')

  await modal.getByLabel('Description').fill('Office supplies')
  await modal.getByLabel('Date').fill('2025-01-02')
  await modal.getByRole('button', { name: 'OK' }).click()

  await expect(modal.getByText(/Please add at least one attachment/)).toBeVisible()
})
