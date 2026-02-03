import dayjs from 'dayjs'
import { locale } from 'next/root-params'

import { AdminEntryTable } from '@/components/AdminEntryTable'
import { getAdminEntries } from '@/data/getAdminEntries'
import { env } from '@/lib/env'

export default async function AdminPage() {
  const curLocale = await locale()

  const entries = await getAdminEntries(curLocale)
  const oldArchivedCutoff = dayjs()
    .subtract(env.NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS, 'days')
    .toISOString()

  return (
    <AdminEntryTable entries={entries} oldArchivedCutoff={oldArchivedCutoff} />
  )
}
