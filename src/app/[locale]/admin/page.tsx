import dayjs from 'dayjs'
import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { AdminEntryTable } from '@/components/AdminEntryTable'
import { getAdminEntries } from '@/data/getAdminEntries'
import { env } from '@/lib/env'

export default async function AdminPage({
  params
}: PageProps<'/[locale]/admin'>) {
  const { locale } = await params
  const nextIntlLocale = locale as Locale
  setRequestLocale(nextIntlLocale)

  const entries = await getAdminEntries(nextIntlLocale)
  const oldArchivedCutoff = dayjs()
    .subtract(env.NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS, 'days')
    .toISOString()

  return (
    <AdminEntryTable entries={entries} oldArchivedCutoff={oldArchivedCutoff} />
  )
}
