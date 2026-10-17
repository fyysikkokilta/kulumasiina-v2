import { expect, test } from '@playwright/test'

import type { NocfoDocumentCreate } from '@/lib/nocfo-documents'

import { startFakeNocfo } from './utils/fake-nocfo'

const PORT = 55434
const fake = `http://localhost:${PORT}`
const DOCUMENT_PATH = '/v1/business/test-guild/document/'

type Client = typeof import('@/lib/nocfo')
let client: Client
let server: { close(): Promise<void> }

const payloadWithMarker = (marker: string): NocfoDocumentCreate => ({
  date: '2026-10-01',
  description: `Expense claims ${marker}`,
  is_draft: false,
  attachment_ids: [],
  blueprint: {
    debet_entries: [{ account_id: 11, description: 'Item', amount: 1000, vat_rate: 0 }],
    credit_entries: [{ account_id: 99, description: 'Payable', amount: 1000, vat_rate: 0 }]
  }
})

const payload = payloadWithMarker('[KM:00000000]')

type LoggedRequest = {
  method: string
  path: string
  headers: Record<string, string>
  body: unknown
}

async function requests(method: string, path: string): Promise<LoggedRequest[]> {
  const all = (await (await fetch(`${fake}/__requests`)).json()) as LoggedRequest[]
  return all.filter((r) => r.method === method && r.path === path)
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async () => {
  server = await startFakeNocfo(PORT)
  process.env.NOCFO_API_URL = fake
  client = await import('@/lib/nocfo')
})

test.afterAll(async () => {
  await server.close()
})

test.beforeEach(async () => {
  await fetch(`${fake}/__reset`, { method: 'POST' })
})

test(
  'findAccountId resolves known numbers and returns null for unknown',
  { tag: '@node' },
  async () => {
    expect(await client.findAccountId('4205')).toBe(11)
    expect(await client.findAccountId('TODO')).toBeNull()
  }
)

test('createDocument sends token and idempotency key', { tag: '@node' }, async () => {
  const id = await client.createDocument(payload, 'key-1')
  expect(id).toEqual(expect.any(Number))
  const [req] = await requests('POST', DOCUMENT_PATH)
  expect(req.headers.authorization).toBe('Token test-nocfo-token')
  expect(req.headers['idempotency-key']).toBe('key-1')
})

test('findDocumentIdByMarker finds a created document', { tag: '@node' }, async () => {
  const id = await client.createDocument(payloadWithMarker('[KM:aaaaaaaa]'), 'key-2')
  expect(await client.findDocumentIdByMarker('[KM:aaaaaaaa]')).toBe(id)
  expect(await client.findDocumentIdByMarker('[KM:zzzzzzzz]')).toBeNull()
})

test('uploadFile posts multipart and returns the id', { tag: '@node' }, async () => {
  const id = await client.uploadFile('receipt.pdf', Buffer.from('%PDF-1.4'))
  expect(id).toEqual(expect.any(Number))
  const [req] = await requests('POST', '/v1/business/test-guild/file_upload/')
  expect(req.body).toBe('<multipart>')
})

test('non-2xx responses throw NocfoError with status and body', { tag: '@node' }, async () => {
  await fetch(`${fake}/__fail-next-document`, { method: 'POST' })
  await expect(client.createDocument(payload, 'key-3')).rejects.toMatchObject({ status: 500 })
})
