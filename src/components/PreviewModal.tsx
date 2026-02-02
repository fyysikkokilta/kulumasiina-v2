import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type PreviewState } from '@/utils/preview-utils'

interface PreviewModalProps {
  previewState: PreviewState | null
  closePreview: () => void
}

export function PreviewModal({
  previewState,
  closePreview
}: PreviewModalProps) {
  const t = useTranslations('PreviewModal')

  const title =
    previewState &&
    `${previewState.title} ${previewState.isNotReceipt ? `(${t('is_not_receipt')})` : previewState.value ? `(${previewState.value.toFixed(2)} €)` : ''}`

  return (
    <Dialog.Root
      open={!!previewState}
      onOpenChange={(open) => !open && closePreview()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[90%] max-w-[1400px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white shadow-lg">
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
            {previewState &&
              (previewState.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewState.url}
                  alt={previewState.title}
                  className="max-h-[calc(80vh-65px)] max-w-full object-contain"
                />
              ) : (
                <iframe
                  src={previewState.url}
                  className="h-full w-full border-0"
                  title={previewState.title}
                  style={{ height: 'calc(80vh - 65px)' }}
                />
              ))}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
