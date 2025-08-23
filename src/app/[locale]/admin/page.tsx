import { Locale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { AdminEntryTable } from '@/components/AdminEntryTable'
import { db } from '@/lib/db'

export default async function AdminPage({ params }: PageProps<'/[locale]/admin'>) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const entries = await db.query.entries.findMany({
    with: {
      items: {
        with: {
          attachments: true
        }
      },
      mileages: true
    }
  })

  return <AdminEntryTable entries={entries} />
}
