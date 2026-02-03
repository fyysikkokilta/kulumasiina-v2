import dayjs from 'dayjs'

import { EntryRow } from '@/components/AdminEntryTableColumns'
import type { AdminEntries } from '@/data/getAdminEntries'

import { bookkeepingAccounts } from './bookkeeping-accounts'

export const PAGE_SIZES = [10, 25, 50] as const

export const STATUS_COLORS: Record<
  'submitted' | 'approved' | 'paid' | 'denied',
  'blue' | 'green' | 'purple' | 'red'
> = {
  submitted: 'blue',
  approved: 'green',
  paid: 'purple',
  denied: 'red'
}

/**
 * Returns true if the entry is archived and its paid/rejection date is before
 * the given cutoff. Pass cutoffIso from the server to avoid using current time
 * in a Client Component (Next.js prerender).
 */
export function isOldArchived(
  entry: AdminEntries[number],
  cutoffIso: string
): boolean {
  if (!entry.archived) return false
  const date =
    entry.status === 'paid'
      ? entry.paidDate && dayjs(entry.paidDate)
      : entry.rejectionDate && dayjs(entry.rejectionDate)
  const cutoff = dayjs(cutoffIso)
  return !!(date && date.isBefore(cutoff))
}

export function formatEntryForClipboard(entry: EntryRow): string {
  const accounts = [
    ...entry.items.map((i) => i.account),
    ...entry.mileages.map((m) => m.account)
  ]
  const labels = [...new Set(accounts)]
    .filter(Boolean)
    .map((v) => bookkeepingAccounts.find((a) => a.value === v)?.label)
    .filter(Boolean)
    .sort()
    .join(', ')
  const km = entry.mileages.reduce((s, m) => s + m.distance, 0)
  const kmStr = km > 0 ? ` (${km} km)` : ''
  const totalStr = entry.total.toFixed(2).replace('.', ',')
  return `${entry.name}, ${entry.title}${kmStr}; ${totalStr} € (${labels})`
}
