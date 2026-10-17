import { env } from '@/lib/env'
import {
  markerEntryIds,
  markerId,
  type MarkedDocument,
  type NocfoDocumentCreate
} from '@/lib/nocfo-documents'

export class NocfoError extends Error {
  status: number
  body: string

  constructor(status: number, body: string) {
    super(`NoCFO request failed with status ${status}`)
    this.name = 'NocfoError'
    this.status = status
    this.body = body
  }
}

type ListResponse<T> = { results: T[] }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = env.NOCFO_API_URL.replace(/\/+$/, '')
  const url = `${base}/v1/business/${encodeURIComponent(env.NOCFO_BUSINESS_SLUG)}/${path}`
  const res = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Token ${env.NOCFO_API_TOKEN}` }
  })
  if (!res.ok) {
    throw new NocfoError(res.status, await res.text())
  }
  return (await res.json()) as T
}

export async function findAccountId(number: string): Promise<number | null> {
  const data = await request<ListResponse<{ id: number }>>(
    `account/?number=${encodeURIComponent(number)}`
  )
  return data.results[0]?.id ?? null
}

/** Documents whose `[KM:...]` marker holds the entry, with the marker's entry ids */
export async function findDocumentsWithEntry(entryId: string): Promise<MarkedDocument[]> {
  const id = markerId(entryId)
  const data = await request<ListResponse<{ id: number; description?: string | null }>>(
    `document/?search=${encodeURIComponent(id)}`
  )
  return data.results.flatMap((d) => {
    const marker = markerEntryIds(d.description ?? '').find((ids) => ids.includes(id))
    return marker ? [{ id: d.id, entryIds: marker }] : []
  })
}

export async function uploadFile(name: string, data: Buffer): Promise<number> {
  const form = new FormData()
  form.append('file', new Blob([new Uint8Array(data)], { type: 'application/pdf' }), name)
  form.append('name', name)
  const res = await request<{ id: number }>('file_upload/', { method: 'POST', body: form })
  return res.id
}

export async function createDocument(
  payload: NocfoDocumentCreate,
  idempotencyKey: string
): Promise<number> {
  const res = await request<{ id: number }>('document/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify(payload)
  })
  return res.id
}
