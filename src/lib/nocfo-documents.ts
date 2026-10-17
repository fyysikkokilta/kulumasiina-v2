import type { EntryWithItemsAndMileages } from '@/db/types'
import { env } from '@/lib/env'

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

const MAX_DESCRIPTION_LENGTH = 255
const MARKER_ID_LENGTH = 8

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

export function documentLines(entry: EntryWithItemsAndMileages): DocumentLine[] {
  const itemLines = entry.items.map((item) => ({
    accountNumber: item.account,
    description: item.description,
    amountCents: toCents(
      item.attachments.reduce(
        (sum, att) => (att.value && !att.isNotReceipt ? sum + att.value : sum),
        0
      )
    )
  }))
  const mileageLines = entry.mileages.map((m) => ({
    accountNumber: m.account,
    description: `Kilometrikorvaus: ${m.description}`,
    amountCents: toCents(m.distance * env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE)
  }))
  return [...itemLines, ...mileageLines].filter((line) => line.amountCents !== 0)
}

export function entriesMissingAccounts(entries: EntryWithItemsAndMileages[]): string[] {
  return entries
    .filter((e) => [...e.items, ...e.mileages].some((row) => row.account === null))
    .map((e) => e.id)
}

export function documentMarker(entryIds: string[]): string {
  const ids = entryIds.map((id) => id.slice(0, MARKER_ID_LENGTH)).toSorted()
  return `[KM:${ids.join(',')}]`
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function buildDescription(entries: EntryWithItemsAndMileages[]): string {
  const marker = documentMarker(entries.map((e) => e.id))
  const names = unique(entries.map((e) => e.name)).join(', ')
  const titles = unique(entries.map((e) => e.title)).join(', ')
  const prefix = `Kulukorvaus: ${names} – ${titles}`
  const room = MAX_DESCRIPTION_LENGTH - marker.length - 1
  const head = prefix.length > room ? prefix.slice(0, room) : prefix
  return `${head} ${marker}`
}

export function buildDocumentPayload(args: {
  entries: EntryWithItemsAndMileages[]
  paidDate: Date
  accountIds: Map<string, number>
  payableAccountId: number
  attachmentIds: number[]
}): NocfoDocumentCreate {
  const { entries, paidDate, accountIds, payableAccountId, attachmentIds } = args
  const description = buildDescription(entries)

  const debet_entries = entries.flatMap(documentLines).map((line): BlueprintEntry => {
    const accountId = line.accountNumber === null ? undefined : accountIds.get(line.accountNumber)
    if (accountId === undefined) {
      throw new Error(`No NoCFO account id for account ${line.accountNumber ?? '(none)'}`)
    }
    return {
      account_id: accountId,
      description: line.description,
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
      credit_entries: [{ account_id: payableAccountId, description, amount: total, vat_rate: 0 }]
    }
  }
}
