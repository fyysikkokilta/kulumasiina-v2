'use client'

import { AlertTriangle, Download, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { ExportErrorPayload } from '@/lib/export-error'

interface ExportPageProps {
  apiUrl: string
}

type ExportState = 'loading' | 'success' | 'error'

export function ExportPage({ apiUrl }: ExportPageProps) {
  const t = useTranslations('ExportPage')
  const router = useRouter()
  const [state, setState] = useState<ExportState>('loading')
  const [errorPayload, setErrorPayload] = useState<ExportErrorPayload | null>(null)

  const doExport = useCallback(async () => {
    setState('loading')
    setErrorPayload(null)

    if (!apiUrl.startsWith('/api/')) {
      setErrorPayload({
        code: 'INVALID_API_URL',
        message: t('invalid_request')
      })
      setState('error')
      return
    }

    try {
      const response = await fetch(apiUrl, {
        credentials: 'include'
      })

      if (!response.ok) {
        const contentType = response.headers.get('content-type') ?? ''
        if (contentType.includes('application/json')) {
          const data: ExportErrorPayload = await response.json()
          setErrorPayload(data)
        } else {
          setErrorPayload({
            code: 'INTERNAL_ERROR',
            message: response.statusText || 'Internal server error.'
          })
        }
        setState('error')
        return
      }

      const blob = await response.blob()
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : 'export'

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setState('success')
    } catch {
      setErrorPayload({
        code: 'INTERNAL_ERROR',
        message: t('network_error')
      })
      setState('error')
    }
  }, [apiUrl, t])

  useEffect(() => {
    void doExport()
  }, [doExport])

  const handleRetry = () => {
    void doExport()
  }

  const handleBack = () => {
    router.push('/admin')
  }

  const handleCopyDetails = () => {
    if (!errorPayload) return
    const text = JSON.stringify(errorPayload, null, 2)
    void navigator.clipboard.writeText(text)
  }

  if (state === 'loading') {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Card
          title={t('title')}
          className="flex min-w-72 flex-col items-center gap-4 p-8 text-center"
        >
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" aria-hidden />
          <div>
            <p className="font-semibold text-gray-900">{t('preparing')}</p>
            <p className="mt-1 text-sm text-gray-500">{t('preparing_subtitle')}</p>
          </div>
        </Card>
      </div>
    )
  }

  if (state === 'success') {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Card
          title={t('title')}
          className="flex min-w-72 flex-col items-center gap-4 p-8 text-center"
        >
          <Download className="h-8 w-8 text-green-600" aria-hidden />
          <div>
            <p className="font-semibold text-gray-900">{t('success_message')}</p>
          </div>
          <Button variant="secondary" onClick={handleBack}>
            {t('back_to_admin')}
          </Button>
        </Card>
      </div>
    )
  }

  // error state
  return (
    <div className="flex min-h-48 items-center justify-center">
      <Card title={t('title')} className="flex min-w-72 flex-col gap-4 p-8">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />
          <span className="font-semibold">{t('error_title')}</span>
        </div>
        <p className="text-sm text-gray-500">{t('error_subtitle')}</p>

        {errorPayload && (
          <div className="mt-2 rounded border border-red-200 bg-red-50 p-3 text-left">
            <p className="text-xs font-medium text-gray-700">
              {t('error_code')}:{' '}
              <code className="rounded bg-red-100 px-1 py-0.5 text-xs text-red-700">
                {errorPayload.code}
              </code>
            </p>
            <p className="mt-1 text-xs text-gray-600">{errorPayload.message}</p>
            {errorPayload.entryId && (
              <p className="mt-1 text-xs break-all text-gray-500">
                {t('entry_label')}: {errorPayload.entryId}
              </p>
            )}
            {errorPayload.attachmentId && (
              <p className="mt-0.5 text-xs break-all text-gray-500">
                {t('attachment_label')}: {errorPayload.attachmentId}
              </p>
            )}
            {errorPayload.fileId && (
              <p className="mt-0.5 text-xs break-all text-gray-500">
                {t('file_id_label')}: {errorPayload.fileId}
              </p>
            )}
            {errorPayload.filename && (
              <p className="mt-0.5 text-xs break-all text-gray-500">
                {t('file_label')}: {errorPayload.filename}
              </p>
            )}
            {errorPayload.missingEntryIds && errorPayload.missingEntryIds.length > 0 && (
              <p className="mt-0.5 text-xs break-all text-gray-500">
                {t('missing_entries_label')}: {errorPayload.missingEntryIds.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2">
          <Button variant="primary" onClick={handleRetry}>
            {t('retry')}
          </Button>
          <Button variant="secondary" onClick={handleBack}>
            {t('back_to_admin')}
          </Button>
          {errorPayload && (
            <Button variant="ghost" size="small" onClick={handleCopyDetails}>
              {t('copy_details')}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
