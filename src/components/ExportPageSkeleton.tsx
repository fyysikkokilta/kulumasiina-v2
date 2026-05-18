'use client'

import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Card } from '@/components/ui/Card'

export function ExportPageSkeleton() {
  const t = useTranslations('ExportPage')

  return (
    <div className="flex min-h-48 items-center justify-center">
      <Card className="flex min-w-72 flex-col items-center gap-4 p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
        <div>
          <p className="font-semibold text-gray-900">{t('preparing')}</p>
          <p className="mt-1 text-sm text-gray-500">{t('preparing_subtitle')}</p>
        </div>
      </Card>
    </div>
  )
}
