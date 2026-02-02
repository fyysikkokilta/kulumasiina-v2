import { expect, test } from '@playwright/test'

test('home page loads with expense form', async ({ page }) => {
  await page.goto('/en')

  await expect(
    page.getByRole('heading', { name: 'FK-Expenses', level: 1 })
  ).toBeVisible()
  await expect(page.getByLabel('Payee Name')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible()
})

test('login page shows Google login option', async ({ page }) => {
  await page.goto('/en/login')

  await expect(
    page.getByRole('heading', { name: 'Login Required' })
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Login with Google' })
  ).toBeVisible()
})

test('language switcher toggles to Finnish', async ({ page }) => {
  await page.goto('/en')

  await expect(
    page.getByRole('heading', { name: 'FK-Expenses', level: 1 })
  ).toBeVisible()

  await page.getByRole('button', { name: 'FI' }).click()

  await expect(page).toHaveURL(/\/fi\b/)
  await expect(
    page.getByRole('heading', { name: 'FK-Kulut', level: 1 })
  ).toBeVisible()
})

test('language switcher toggles back to English from Finnish', async ({
  page
}) => {
  await page.goto('/fi')

  // Use first() to avoid Next.js Dev Tools button which may also match "EN"
  await page.getByRole('button', { name: 'EN', exact: true }).first().click()

  await expect(page).toHaveURL(/\/en\b/)
  await expect(
    page.getByRole('heading', { name: 'FK-Expenses', level: 1 })
  ).toBeVisible()
})

test('home page in Finnish shows Finnish labels', async ({ page }) => {
  await page.goto('/fi')

  await expect(
    page.getByRole('heading', { name: 'FK-Kulut', level: 1 })
  ).toBeVisible()
  await expect(page.getByLabel('Maksun saajan nimi')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lähetä' })).toBeVisible()
})
