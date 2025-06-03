import { AdminEntryTable } from '@/components/admin/AdminEntryTable'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function AdminPage() {
  await requireAuth()

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
