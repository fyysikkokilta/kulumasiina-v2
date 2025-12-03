import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { AdminEntryTable } from '@/components/AdminEntryTable'
import { getAdminEntries } from '@/data/getAdminEntries'

export default async function AdminPage({
  params
}: PageProps<'/[locale]/admin'>) {
  const { locale } = await params
  const nextIntlLocale = locale as Locale
  setRequestLocale(nextIntlLocale)

  const entries = await getAdminEntries(nextIntlLocale)

  return <AdminEntryTable entries={entries} />
}
