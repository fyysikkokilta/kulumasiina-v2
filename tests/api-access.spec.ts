import { expect, test } from '@playwright/test'

import { getAdminCookieHeader } from './utils/admin-login'
import { seedTestData } from './utils/seed'
import { testAttachmentIds, testEntryIds } from './utils/test-data'

const apiBaseUrl = 'http://localhost:3000'

test.beforeAll(async () => {
  await seedTestData()
})

test('entry pdf api requires auth', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/entry/${testEntryIds.submitted}/pdf`
  )
  expect(res.status()).toBe(404)
})

test('entry pdf api works with auth', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/entry/${testEntryIds.submitted}/pdf`,
    {
      headers: {
        Cookie: await getAdminCookieHeader()
      }
    }
  )
  expect(res.status()).toBe(200)
})

test('entry csv api requires auth', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/entry/${testEntryIds.approved}/csv`
  )
  expect(res.status()).toBe(404)
})

test('entry csv api works with auth', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/entry/${testEntryIds.approved}/csv`,
    {
      headers: {
        Cookie: await getAdminCookieHeader()
      }
    }
  )
  expect(res.status()).toBe(200)
})

test('multi zip api requires auth', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/entry/multi/zip?entry_ids=${testEntryIds.paid}`
  )
  expect(res.status()).toBe(404)
})

test('multi zip api works with auth', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/entry/multi/zip?entry_ids=${testEntryIds.paid}`,
    {
      headers: {
        Cookie: await getAdminCookieHeader()
      }
    }
  )
  expect(res.status()).toBe(200)
})

test('attachment api requires auth for existing file', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/attachment/${testAttachmentIds.submitted}`
  )
  expect(res.status()).toBe(404)
})

test('attachment api works with auth', async ({ request }) => {
  const res = await request.get(
    `${apiBaseUrl}/api/attachment/${testAttachmentIds.submitted}`,
    {
      headers: {
        Cookie: await getAdminCookieHeader()
      }
    }
  )
  expect(res.status()).toBe(200)
})
