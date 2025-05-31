import { db } from '@/lib/db'

import { AdminEntryTable } from './AdminEntryTable'

export async function AdminEntryView() {
  const entries = await db.query.entries.findMany({
    with: {
      items: {
        with: {
          attachments: {
            columns: {
              data: false
            }
          }
        }
      },
      mileages: true
    }
  })

  return (
    <div className="space-y-4">
      <AdminEntryTable entries={entries} />
    </div>
  )
}
