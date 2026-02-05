import { Dialog } from '@base-ui/react/dialog'
import { Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Suspense, use } from 'react'

import type { PreviewState } from '@/utils/preview-utils'

interface PreviewModalProps {
  previewState: PreviewState | null
  closePreview: () => void
}

function PreviewContent({
  promise,
  closePreview
}: {
  promise: PreviewState
  closePreview: () => void
}) {
  const t = useTranslations('PreviewModal')
  const data = use(promise)

  const title = `${data.title} ${data.isNotReceipt ? `(${t('is_not_receipt')})` : data.value ? `(${data.value.toFixed(2)} €)` : ''}`

  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <Dialog.Title className="text-center text-lg font-semibold text-gray-900">
          {title}
        </Dialog.Title>
        <Dialog.Close
          className="rounded-sm p-1 text-gray-400 transition-colors hover:text-gray-600"
          onClick={closePreview}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">{t('close')}</span>
        </Dialog.Close>
      </div>
      <Dialog.Description className="sr-only">{title}</Dialog.Description>
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-b-lg bg-gray-50">
        {data.isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.url}
            alt={data.title}
            className="max-h-[calc(80vh-65px)] max-w-full object-contain"
          />
        ) : (
          <iframe
            src={data.url}
            className="h-full w-full border-0"
            title={data.title}
            style={{ height: 'calc(80vh - 65px)' }}
          />
        )}
      </div>
    </>
  )
}

function PreviewFallback({ closePreview }: { closePreview: () => void }) {
  const t = useTranslations('PreviewModal')
  return (
    <>
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <Dialog.Title className="text-center text-lg font-semibold text-gray-900">
          {t('loading')}
        </Dialog.Title>
        <Dialog.Close
          className="rounded-sm p-1 text-gray-400 transition-colors hover:text-gray-600"
          onClick={closePreview}
        >
          <X className="h-5 w-5" />
          <span className="sr-only">{t('close')}</span>
        </Dialog.Close>
      </div>
      <div className="relative flex h-full min-h-[300px] w-full items-center justify-center overflow-hidden rounded-b-lg bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" aria-hidden />
        <span className="sr-only">{t('loading')}</span>
      </div>
    </>
  )
}

export function PreviewModal({
  previewState,
  closePreview
}: PreviewModalProps) {
  return (
    <Dialog.Root
      open={!!previewState}
      onOpenChange={(open) => !open && closePreview()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg">
          {previewState ? (
            <Suspense
              fallback={<PreviewFallback closePreview={closePreview} />}
            >
              <PreviewContent
                promise={previewState}
                closePreview={closePreview}
              />
            </Suspense>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
