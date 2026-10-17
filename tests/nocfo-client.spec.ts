import { expect, test } from '@playwright/test'

import type { NocfoDocumentCreate } from '@/lib/nocfo-documents'

import { startFakeNocfo } from './utils/fake-nocfo'

// Same port as the fake that global setup starts: the app env (and so the client) is fixed to it
const PORT = 55433
const fake = `http://localhost:${PORT}`
const DOCUMENT_PATH = '/v1/business/test-guild/document/'

type Client = typeof import('@/lib/nocfo')
let client: Client
let server: { close(): Promise<void> } | null

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
  // Under `pnpm test` global setup already runs the fake; under `test:node` nothing does
  server = await startFakeNocfo(PORT).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') return null
    throw error
  })
  process.env.NOCFO_API_URL = fake
  client = await import('@/lib/nocfo')
})

test.afterAll(async () => {
  await server?.close()
})

test.beforeEach(async () => {
  await fetch(`${fake}/__reset`, { method: 'POST' })
})

test(
  'findAccountId resolves known numbers and returns null for unknown',
  { tag: '@node' },
  async () => {
    expect(await client.findAccountId('4205')).toBe(11)
    expect(await client.findAccountId('9999')).toBeNull()
  }
)

test('createDocument sends token and idempotency key', { tag: '@node' }, async () => {
  const id = await client.createDocument(payload, 'key-1')
  expect(id).toEqual(expect.any(Number))
  const [req] = await requests('POST', DOCUMENT_PATH)
  expect(req.headers.authorization).toBe('Token test-nocfo-token')
  expect(req.headers['idempotency-key']).toBe('key-1')
})

test(
  'findDocumentsWithEntry finds documents whose marker holds the entry',
  { tag: '@node' },
  async () => {
    const id = await client.createDocument(payloadWithMarker('[KM:aaaaaaaa,bbbbbbbb]'), 'key-2')
    await client.createDocument(
      payloadWithMarker('Mentions aaaaaaaa outside [KM:cccccccc]'),
      'key-4'
    )
    expect(await client.findDocumentsWithEntry('aaaaaaaa-0000')).toEqual([
      { id, entryIds: ['aaaaaaaa', 'bbbbbbbb'] }
    ])
    expect(await client.findDocumentsWithEntry('dddddddd-0000')).toEqual([])
  }
)

test(
  'createDocument is rejected by the fake when a description is too long',
  { tag: '@node' },
  async () => {
    await expect(
      client.createDocument(payloadWithMarker('x'.repeat(300)), 'key-5')
    ).rejects.toMatchObject({ status: 400 })
    const longLine = {
      ...payload,
      blueprint: {
        ...payload.blueprint,
        debet_entries: [
          { account_id: 11, description: 'y'.repeat(257), amount: 1000, vat_rate: 0 as const }
        ]
      }
    }
    await expect(client.createDocument(longLine, 'key-6')).rejects.toMatchObject({ status: 400 })
  }
)

test('uploadFile posts multipart and returns the id', { tag: '@node' }, async () => {
  const id = await client.uploadFile('receipt.pdf', Buffer.from('%PDF-1.4'))
  expect(id).toEqual(expect.any(Number))
  const [req] = await requests('POST', '/v1/business/test-guild/file_upload/')
  expect(req.body).toEqual({ fileName: 'receipt.pdf', fileType: 'application/pdf' })
})

test('non-2xx responses throw NocfoError with status and body', { tag: '@node' }, async () => {
  await fetch(`${fake}/__fail-next-document`, { method: 'POST' })
  await expect(client.createDocument(payload, 'key-3')).rejects.toMatchObject({ status: 500 })
})
