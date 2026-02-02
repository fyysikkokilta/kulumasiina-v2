'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/Button'

const statusIcons = {
  success: <CheckCircle2 className="h-16 w-16 text-green-500" />,
  error: <XCircle className="h-16 w-16 text-red-500" />
} as const

export function FormResult({
  status,
  onReset
}: {
  status: 'success' | 'failure'
  onReset: () => void
}) {
  const t = useTranslations('FormResult')
  const isSuccess = status === 'success'
  const resultStatus = isSuccess ? 'success' : 'error'

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4">{statusIcons[resultStatus]}</div>
      <h3 className="mb-2 text-xl font-semibold">{t(`${status}.title`)}</h3>
      <p className="mb-6 text-gray-600">{t(`${status}.sub_title`)}</p>
      <div className="flex gap-2">
        <Button variant="primary" onClick={onReset}>
          {t(isSuccess ? 'success.send_another' : 'failure.try_again')}
        </Button>
      </div>
    </div>
  )
}
