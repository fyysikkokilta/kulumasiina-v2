import { AdminEntryTable } from '@/components/AdminEntryTable'
import { db } from '@/lib/db'

export default async function AdminPage() {
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
