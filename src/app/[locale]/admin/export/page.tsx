import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'

import { ExportPage } from '@/components/ExportPage'

interface ExportPageSearchParams {
  apiUrl?: string
  entryIds?: string
}

export default async function ExportResultPage({
  searchParams
}: {
  searchParams: Promise<ExportPageSearchParams>
}) {
  const t = await getTranslations('ExportPage')
  const params = await searchParams
  const apiUrl = params.apiUrl ?? ''

  return (
    <Suspense
      fallback={
        <div className="flex min-h-48 items-center justify-center">
          <div className="text-gray-500">{t('loading_fallback')}</div>
        </div>
      }
    >
      <ExportPage apiUrl={apiUrl} />
    </Suspense>
  )
}
