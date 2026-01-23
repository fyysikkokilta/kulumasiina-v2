import { expect, test } from '@playwright/test'

import { loginAdmin } from './utils/admin-login'
import { seedTestData } from './utils/seed'

test('admin page redirects when unauthenticated', async ({ page }) => {
  await page.goto('/admin')
  await page.waitForURL('**/login')
  await expect(
    page.getByRole('heading', { name: 'Login Required' })
  ).toBeVisible()
})

test('admin page renders when authenticated', async ({ page }) => {
  await seedTestData()
  await loginAdmin(page)
  await page.goto('/admin')
  await expect(page.locator('.ant-table')).toBeVisible()
})
