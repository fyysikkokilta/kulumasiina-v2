import fs from 'fs/promises'
import path from 'path'

import { expect, test, type APIRequestContext } from '@playwright/test'

import { getAdminCookieHeader } from './utils/admin-login'
import { seedTestData } from './utils/seed'
import { testAttachmentIds, testEntryIds } from './utils/test-data'

const apiBaseUrl = 'http://localhost:3000'
const unknownEntryId = '00000000-0000-4000-8000-000000000000'

test.describe.configure({ mode: 'serial' })

test.beforeEach(async () => {
  await seedTestData()
})

async function getAsAdmin(request: APIRequestContext, url: string) {
  return request.get(`${apiBaseUrl}${url}`, { headers: { Cookie: await getAdminCookieHeader() } })
}

test('pdf export rejects unauthenticated requests', async ({ request }) => {
  const res = await request.get(`${apiBaseUrl}/api/entry/${testEntryIds.paid}/pdf`)
  expect(res.status()).toBe(401)
  expect(await res.json()).toEqual({ code: 'UNAUTHORIZED', message: 'Unauthorized.' })
})

for (const kind of ['pdf']) {
  test(`${kind} export rejects malformed entry id`, async ({ request }) => {
    const res = await getAsAdmin(request, `/api/entry/not-a-uuid/${kind}`)
    expect(res.status()).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'INVALID_ENTRY_IDS' })
  })

  test(`${kind} export returns 404 for unknown entry`, async ({ request }) => {
    const res = await getAsAdmin(request, `/api/entry/${unknownEntryId}/${kind}`)
    expect(res.status()).toBe(404)
    expect(await res.json()).toEqual({
      code: 'ENTRY_NOT_FOUND',
      message: 'Entry not found.',
      entryId: unknownEntryId
    })
  })
}

test('pdf export reports a missing attachment file', async ({ request }) => {
  // seedTestData in beforeEach writes the file back for the following tests
  await fs.rm(path.join(process.cwd(), 'data', testAttachmentIds.paid))

  const expected = {
    code: 'ATTACHMENT_STORAGE_ERROR',
    message: 'Attachment file is missing or unreadable.',
    entryId: testEntryIds.paid,
    attachmentId: testAttachmentIds.paid,
    fileId: testAttachmentIds.paid,
    filename: 'paid-receipt.png'
  }
  const res = await getAsAdmin(request, `/api/entry/${testEntryIds.paid}/pdf`)
  expect(res.status()).toBe(500)
  expect(await res.json()).toEqual(expected)
})
