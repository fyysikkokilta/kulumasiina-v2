import { Suspense } from 'react'

import { AdminContent } from '@/components/AdminContent'
import { AdminEntryTableSkeleton } from '@/components/AdminEntryTableSkeleton'

export default async function AdminPage() {
  return (
    <Suspense fallback={<AdminEntryTableSkeleton />}>
      <AdminContent />
    </Suspense>
  )
}
