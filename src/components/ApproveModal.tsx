'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Field } from '@base-ui/react/field'
import { Form } from '@base-ui/react/form'
import { Input } from '@base-ui/react/input'
import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { approveEntriesAction } from '@/lib/actions/approveEntries'
import { inputClass } from '@/utils/form-styles'

interface ApproveModalProps {
  visible: boolean
  onCancel: () => void
  entryIds: string[]
  onSuccess?: () => void
}

export function ApproveModal({
  visible,
  onCancel,
  entryIds,
  onSuccess
}: ApproveModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<
    Record<string, string | string[]> | undefined
  >(undefined)
  const t = useTranslations('ApproveModal')

  useEffect(() => {
    queueMicrotask(() => setErrors(undefined))
  }, [entryIds, visible])

  const approveFormSchema = z.object({
    date: z.iso.date(t('date_error')).transform((val) => new Date(val)),
    approvalNote: z
      .string()
      .min(1, t('approval_note_error'))
      .max(100, t('approval_note_error'))
  })

  const { execute, status } = useAction(approveEntriesAction, {
    onSuccess: () => {
      setErrors(undefined)
      onSuccess?.()
      onCancel()
    }
  })

  const handleFormSubmit = (formValues: Record<string, string>) => {
    const toParse = {
      date: formValues.date,
      approvalNote: formValues.approvalNote
    }
    const result = approveFormSchema.safeParse(toParse)
    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors)
      return
    }
    setErrors(undefined)
    execute({
      ids: entryIds,
      date: result.data.date,
      approvalNote: result.data.approvalNote
    })
    formRef.current?.reset()
  }

  const handleCancel = () => {
    formRef.current?.reset()
    setErrors(undefined)
    onCancel()
  }

  return (
    <Dialog.Root
      open={visible}
      onOpenChange={(open) => !open && handleCancel()}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Popup
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
          style={{
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
        >
          <Dialog.Title className="mb-4 text-lg font-semibold">
            {t('title')}
          </Dialog.Title>
          <Form
            ref={formRef}
            key={visible ? entryIds.join(',') : 'closed'}
            errors={errors}
            onFormSubmit={handleFormSubmit}
            className="mb-4 space-y-4"
          >
            <Field.Root name="date">
              <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('date')}
              </Field.Label>
              <Input
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
              <Field.Error className="mt-1 text-sm text-red-600" />
            </Field.Root>

            <Field.Root name="approvalNote">
              <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('approval_note')}
              </Field.Label>
              <Input
                defaultValue=""
                maxLength={100}
                placeholder={t('approval_note_placeholder')}
                className={inputClass}
              />
              <Field.Error className="mt-1 text-sm text-red-600" />
            </Field.Root>

            <div className="flex gap-2">
              <Button type="submit" variant="primary" actionStatus={status}>
                {t('submit')}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel}>
                {t('cancel')}
              </Button>
            </div>
          </Form>
          <Dialog.Close
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            onClick={handleCancel}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">{t('close')}</span>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
