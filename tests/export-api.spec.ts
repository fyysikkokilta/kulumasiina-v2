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

for (const url of [
  `/api/entry/${testEntryIds.paid}/pdf`,
  `/api/entry/${testEntryIds.paid}/csv`,
  `/api/entry/multi/zip?entry_ids=${testEntryIds.paid}`
]) {
  test(`${url.split('?')[0]} rejects unauthenticated requests`, async ({ request }) => {
    const res = await request.get(`${apiBaseUrl}${url}`)
    expect(res.status()).toBe(401)
    expect(await res.json()).toEqual({ code: 'UNAUTHORIZED', message: 'Unauthorized.' })
  })
}

for (const kind of ['pdf', 'csv']) {
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

for (const status of ['submitted', 'denied'] as const) {
  test(`csv export rejects ${status} entry`, async ({ request }) => {
    const res = await getAsAdmin(request, `/api/entry/${testEntryIds[status]}/csv`)
    expect(res.status()).toBe(400)
    expect(await res.json()).toEqual({
      code: 'INVALID_ENTRY_STATUS',
      message: `Entry status '${status}' is invalid for this export operation.`,
      entryId: testEntryIds[status]
    })
  })
}

test('zip export requires entry_ids', async ({ request }) => {
  const res = await getAsAdmin(request, '/api/entry/multi/zip')
  expect(res.status()).toBe(400)
  expect(await res.json()).toMatchObject({ code: 'MISSING_ENTRY_IDS' })
})

test('zip export rejects empty entry_ids list', async ({ request }) => {
  const res = await getAsAdmin(request, '/api/entry/multi/zip?entry_ids=,%20,')
  expect(res.status()).toBe(400)
  expect(await res.json()).toMatchObject({ code: 'MISSING_ENTRY_IDS' })
})

test('zip export rejects malformed entry ids', async ({ request }) => {
  const res = await getAsAdmin(
    request,
    `/api/entry/multi/zip?entry_ids=${testEntryIds.paid},not-a-uuid`
  )
  expect(res.status()).toBe(400)
  expect(await res.json()).toMatchObject({ code: 'INVALID_ENTRY_IDS' })
})

test('zip export lists missing entries', async ({ request }) => {
  const res = await getAsAdmin(
    request,
    `/api/entry/multi/zip?entry_ids=${testEntryIds.paid},${unknownEntryId}`
  )
  expect(res.status()).toBe(404)
  expect(await res.json()).toEqual({
    code: 'SOME_ENTRIES_NOT_FOUND',
    message: 'Some entries were not found.',
    missingEntryIds: [unknownEntryId]
  })
})

test('zip export rejects entries that are not paid', async ({ request }) => {
  const res = await getAsAdmin(
    request,
    `/api/entry/multi/zip?entry_ids=${testEntryIds.paid},${testEntryIds.approved}`
  )
  expect(res.status()).toBe(400)
  expect(await res.json()).toEqual({
    code: 'INVALID_ENTRY_STATUS',
    message: "Entry status 'approved' is invalid for this export operation.",
    entryId: testEntryIds.approved
  })
})

test('exports report a missing attachment file', async ({ request }) => {
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
  for (const url of [
    `/api/entry/${testEntryIds.paid}/pdf`,
    `/api/entry/${testEntryIds.paid}/csv`,
    `/api/entry/multi/zip?entry_ids=${testEntryIds.paid}`
  ]) {
    const res = await getAsAdmin(request, url)
    expect(res.status(), url).toBe(500)
    expect(await res.json(), url).toEqual(expected)
  }
})
