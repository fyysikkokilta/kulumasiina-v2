'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Form } from '@base-ui/react/form'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'

import { Button } from '@/components/ui/Button'
import { deleteOldArchivedEntriesAction } from '@/lib/actions/deleteOldArchivedEntries'

interface DeleteOldArchivedModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

export function DeleteOldArchivedModal({
  visible,
  onCancel,
  onSuccess
}: DeleteOldArchivedModalProps) {
  const t = useTranslations('DeleteOldArchivedModal')

  const { execute: deleteOldArchivedEntries, status } = useAction(
    deleteOldArchivedEntriesAction,
    {
      onSuccess: () => {
        onSuccess()
      },
      onError: (error) => {
        console.error(error)
      }
    }
  )

  return (
    <Dialog.Root open={visible} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {t('title')}
            </Dialog.Title>
            <Dialog.Close
              className="rounded-sm p-1 text-gray-400 transition-colors hover:text-gray-600"
              onClick={onCancel}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">{t('close')}</span>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            {t('title')}
          </Dialog.Description>
          <Form
            onFormSubmit={() => deleteOldArchivedEntries()}
            className="space-y-4"
          >
            <p className="text-red-600">{t('text_1')}</p>
            <p>{t('text_2')}</p>
            <div className="flex gap-2">
              <Button type="submit" variant="danger" actionStatus={status}>
                {t('remove')}
              </Button>
              <Button type="button" variant="secondary" onClick={onCancel}>
                {t('cancel')}
              </Button>
            </div>
          </Form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
