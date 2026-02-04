import dayjs from 'dayjs'
import { locale } from 'next/root-params'

import { getAdminEntries } from '@/data/getAdminEntries'
import { env } from '@/lib/env'

import { AdminEntryTable } from './AdminEntryTable'

export async function AdminContent() {
  const curLocale = await locale()
  const entries = await getAdminEntries(curLocale)
  const oldArchivedCutoff = dayjs()
    .subtract(env.NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS, 'days')
    .toISOString()

  return (
    <AdminEntryTable entries={entries} oldArchivedCutoff={oldArchivedCutoff} />
  )
}
