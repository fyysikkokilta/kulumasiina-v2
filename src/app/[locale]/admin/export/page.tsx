import { Suspense, use } from 'react'

import { ExportPage } from '@/components/ExportPage'
import { ExportPageSkeleton } from '@/components/ExportPageSkeleton'

interface ExportPageSearchParams {
  apiUrl?: string
}

function ExportPageWrapper({ searchParams }: { searchParams: Promise<ExportPageSearchParams> }) {
  const params = use(searchParams)
  const apiUrl = params.apiUrl ?? ''

  return <ExportPage apiUrl={apiUrl} />
}

export default function ExportResultPage({
  searchParams
}: {
  searchParams: Promise<ExportPageSearchParams>
}) {
  return (
    <Suspense fallback={<ExportPageSkeleton />}>
      <ExportPageWrapper searchParams={searchParams} />
    </Suspense>
  )
}
