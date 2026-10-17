import type { EntryWithItemsAndMileages } from '@/db/types'
import { env } from '@/lib/env'
import { calculateFormEntriesTotal } from '@/utils/entry-total-utils'

export type DocumentLine = {
  accountNumber: string | null
  description: string
  amountCents: number
}

export type BlueprintEntry = {
  account_id: number
  description: string
  amount: number
  vat_rate: 0
}

export type NocfoDocumentCreate = {
  date: string
  description: string
  is_draft: false
  attachment_ids: number[]
  blueprint: {
    debet_entries: BlueprintEntry[]
    credit_entries: BlueprintEntry[]
  }
}

// NoCFO rejects document and blueprint entry descriptions longer than this
const MAX_DESCRIPTION_LENGTH = 256
const MARKER_ID_LENGTH = 8
const DESCRIPTION_PREFIX = 'Kulukorvaus'
const ELLIPSIS = '…'

/** The group's marker leaves no room for a description prefix within NoCFO's limit */
export class TooManyEntriesError extends Error {
  constructor(count: number) {
    super(`Marker for ${count} entries does not fit in a NoCFO document description`)
    this.name = 'TooManyEntriesError'
  }
}

export function toCents(euros: number): number {
  return Math.round(euros * 100)
}

const cleanKeyPart = (s: string) => s.replace(/\s/g, '').toUpperCase()

export function payeeKey(e: { iban: string; govId: string | null }): string {
  const clean = cleanKeyPart
  return `${clean(e.iban)}|${clean(e.govId ?? '')}`
}

export function groupByPayee<T extends { iban: string; govId: string | null }>(
  entries: T[]
): T[][] {
  const groups = new Map<string, T[]>()
  for (const e of entries) {
    const key = payeeKey(e)
    groups.set(key, [...(groups.get(key) ?? []), e])
  }
  return [...groups.values()]
}

type RawLine = { accountNumber: string | null; description: string; euros: number }

const accountOrNull = (account: string | null) => account || null

function rawLines(entry: EntryWithItemsAndMileages): RawLine[] {
  const itemLines = entry.items.map((item) => ({
    accountNumber: accountOrNull(item.account),
    description: item.description,
    euros: item.attachments.reduce(
      (sum, att) => (att.value && !att.isNotReceipt ? sum + att.value : sum),
      0
    )
  }))
  const mileageLines = entry.mileages.map((m) => ({
    accountNumber: accountOrNull(m.account),
    description: `Kilometrikorvaus: ${m.description}`,
    euros: m.distance * env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE
  }))
  return [...itemLines, ...mileageLines]
}

/**
 * Lines rounded to cents. The entry total is rounded once, like the PDF and the
 * admin table, and the rounding residual goes to the last non-zero line.
 */
export function documentLines(entry: EntryWithItemsAndMileages): DocumentLine[] {
  const raw = rawLines(entry)
  const rounded = raw.map((line) => toCents(line.euros))
  const entryCents = toCents(calculateFormEntriesTotal(entry.items, entry.mileages))
  const residual = entryCents - rounded.reduce((sum, cents) => sum + cents, 0)
  const lastNonZero = raw.findLastIndex((line) => line.euros !== 0)
  return raw
    .map((line, i) => ({
      accountNumber: line.accountNumber,
      description: line.description,
      amountCents: i === lastNonZero ? rounded[i] + residual : rounded[i]
    }))
    .filter((line) => line.amountCents !== 0)
}

export function entriesMissingAccounts(entries: EntryWithItemsAndMileages[]): string[] {
  return entries
    .filter((e) => [...e.items, ...e.mileages].some((row) => !row.account))
    .map((e) => e.id)
}

export const markerId = (entryId: string) => entryId.slice(0, MARKER_ID_LENGTH)

export function documentMarker(entryIds: string[]): string {
  const ids = entryIds.map(markerId).toSorted()
  return `[KM:${ids.join(',')}]`
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

/** Entry id prefixes of every `[KM:...]` marker in a NoCFO document description */
export function markerEntryIds(description: string): string[][] {
  return [...description.matchAll(/\[KM:([^\]]*)\]/g)].map((m) => m[1].split(','))
}

export type MarkedDocument = { id: number; entryIds: string[] }
export type ExistingDocument =
  | { kind: 'none' }
  | { kind: 'match'; documentId: number }
  | { kind: 'conflict'; documentId: number }

/**
 * Given NoCFO documents whose marker holds some of the group's entries: one with
 * exactly the group's entries is the group's own (lost response), any other
 * means the entries were already sent with a different selection.
 */
export function classifyExistingDocuments(
  entryIds: string[],
  documents: MarkedDocument[]
): ExistingDocument {
  const wanted = documentMarker(entryIds)
  const match = documents.find((d) => documentMarker(d.entryIds) === wanted)
  if (match) return { kind: 'match', documentId: match.id }
  const [conflict] = documents
  return conflict ? { kind: 'conflict', documentId: conflict.id } : { kind: 'none' }
}

// Cut at a code unit boundary without leaving half of a surrogate pair
const truncate = (s: string, length: number) =>
  s.length <= length ? s : s.slice(0, length).replace(/[\uD800-\uDBFF]$/, '')

/**
 * `Kulukorvaus: <names> – <titles> <marker>`, at most 256 chars. The prefix is
 * truncated and the marker kept whole, since duplicate detection relies on it.
 */
export function documentDescription(entries: EntryWithItemsAndMileages[]): string {
  const marker = documentMarker(entries.map((e) => e.id))
  const room = MAX_DESCRIPTION_LENGTH - marker.length - 1
  if (room < DESCRIPTION_PREFIX.length + ELLIPSIS.length) {
    throw new TooManyEntriesError(entries.length)
  }
  const names = unique(entries.map((e) => e.name)).join(', ')
  const titles = unique(entries.map((e) => e.title)).join(', ')
  const prefix = `${DESCRIPTION_PREFIX}: ${names} – ${titles}`
  const fitted =
    prefix.length <= room ? prefix : `${truncate(prefix, room - ELLIPSIS.length)}${ELLIPSIS}`
  return `${fitted} ${marker}`
}

function limitLineDescription(description: string): string {
  return truncate(description, MAX_DESCRIPTION_LENGTH)
}

export function buildDocumentPayload(args: {
  entries: EntryWithItemsAndMileages[]
  paidDate: Date
  accountIds: Map<string, number>
  bankAccountId: number
  attachmentIds: number[]
}): NocfoDocumentCreate {
  const { entries, paidDate, accountIds, bankAccountId, attachmentIds } = args
  const description = documentDescription(entries)

  const debet_entries = entries.flatMap(documentLines).map((line): BlueprintEntry => {
    const accountId = line.accountNumber === null ? undefined : accountIds.get(line.accountNumber)
    if (accountId === undefined) {
      throw new Error(`No NoCFO account id for account ${line.accountNumber ?? '(none)'}`)
    }
    return {
      account_id: accountId,
      description: limitLineDescription(line.description),
      amount: line.amountCents,
      vat_rate: 0
    }
  })

  const total = debet_entries.reduce((sum, e) => sum + e.amount, 0)

  return {
    date: paidDate.toISOString().slice(0, 10),
    description,
    is_draft: false,
    attachment_ids: attachmentIds,
    blueprint: {
      debet_entries,
      credit_entries: [
        {
          account_id: bankAccountId,
          description,
          amount: total,
          vat_rate: 0
        }
      ]
    }
  }
}
