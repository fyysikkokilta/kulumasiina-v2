import { Image, Modal } from 'antd'
import { useTranslations } from 'next-intl'
import React from 'react'

export interface PreviewState {
  open: boolean
  url: string
  title: string
  isImage: boolean
  isNotReceipt: boolean
  value: number | null
}

interface PreviewModalProps {
  previewState: PreviewState
  closePreview: () => void
}

export function PreviewModal({ previewState, closePreview }: PreviewModalProps) {
  const t = useTranslations('form.expense')

  const title = `${previewState.title} ${previewState.isNotReceipt ? `(${t('is_not_receipt')})` : previewState.value ? `(${previewState.value.toFixed(2)} €)` : ''}`

  if (previewState.isImage) {
    return (
      <Image
        src={previewState.url}
        alt={previewState.title}
        style={{ display: 'none' }}
        preview={{
          destroyOnHidden: true,
          visible: previewState.open,
          onVisibleChange: (visible) => {
            if (!visible) {
              closePreview()
            }
          },
          imageRender(originalNode) {
            return (
              <div className="rounded-lg bg-white">
                <div className="rounded-lg bg-white px-6 py-4">
                  <h3 className="text-center text-lg font-semibold text-gray-900">{title}</h3>
                </div>
                <div className="flex justify-center rounded-b-lg bg-gray-50 p-8">
                  {originalNode}
                </div>
              </div>
            )
          }
        }}
      />
    )
  }

  return (
    <Modal
      open={previewState.open}
      title={null}
      footer={null}
      onCancel={closePreview}
      width="90%"
      style={{ maxWidth: '1400px' }}
      styles={{
        body: { padding: 0, height: '80vh' }
      }}
    >
      <div className="overflow-hidden rounded-lg bg-white">
        <div className="bg-white px-6 py-4">
          <h3 className="text-center text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="relative h-full w-full overflow-hidden rounded-b-lg bg-gray-50">
          <iframe
            src={previewState.url}
            className="h-full w-full border-0"
            title={previewState.title}
            style={{ height: 'calc(80vh - 65px)' }}
          />
        </div>
      </div>
    </Modal>
  )
}
