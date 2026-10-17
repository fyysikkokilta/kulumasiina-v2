'use client'

import { Checkbox } from '@base-ui/react/checkbox'
import { Dialog } from '@base-ui/react/dialog'
import { Field } from '@base-ui/react/field'
import { Form } from '@base-ui/react/form'
import { Input } from '@base-ui/react/input'
import { Check, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import { useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Required } from '@/components/ui/Required'
import { payEntriesAction } from '@/lib/actions/payEntries'
import { inputClass } from '@/utils/form-styles'

interface PayModalProps {
  visible: boolean
  onCancel: () => void
  entryIds: string[]
  onSuccess?: () => void
  /** Some entries were paid but others failed and the dialog stays open */
  onPartialSuccess?: () => void
}

// Mounted only while visible, so every opening starts with fresh form and action state
export function PayModal(props: PayModalProps) {
  return props.visible ? <PayModalContent {...props} /> : null
}

function PayModalContent({
  visible,
  onCancel,
  entryIds,
  onSuccess,
  onPartialSuccess
}: PayModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  // Narrowed to the failed entries after a partial failure, so pressing Pay again retries only them
  const [pendingIds, setPendingIds] = useState(entryIds)
  const [errors, setErrors] = useState<Record<string, string | string[]> | undefined>(undefined)
  const [sendToNocfo, setSendToNocfo] = useState(true)
  const t = useTranslations('PayModal')
  const locale = useLocale()

  const payFormSchema = z.object({
    date: z.iso.date(t('date_error')).transform((val) => new Date(val))
  })

  const { execute, status, result } = useAction(payEntriesAction, {
    onSuccess: ({ data }) => {
      if (data.failed.length > 0) {
        const failedIds = data.failed.flatMap((f) => f.entryIds)
        if (failedIds.length < pendingIds.length) onPartialSuccess?.()
        setPendingIds(failedIds)
        return
      }
      setErrors(undefined)
      onSuccess?.()
      onCancel()
    }
  })
  const failures = result.data?.failed ?? []

  const handleFormSubmit = (formValues: Record<string, string>) => {
    const toParse = { date: formValues.date }
    const parsed = payFormSchema.safeParse(toParse)
    if (!parsed.success) {
      setErrors(z.flattenError(parsed.error).fieldErrors)
      return
    }
    setErrors(undefined)
    execute({
      ids: pendingIds,
      date: parsed.data.date,
      sendToNocfo,
      locale: locale as 'en' | 'fi'
    })
  }

  const handleCancel = () => {
    formRef.current?.reset()
    setErrors(undefined)
    onCancel()
  }

  return (
    <Dialog.Root open={visible} onOpenChange={(open) => !open && handleCancel()}>
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
          <Dialog.Title className="mb-4 text-lg font-semibold">{t('title')}</Dialog.Title>
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
                <Required />
              </Field.Label>
              <Input type="date" className={inputClass} />
              <Field.Error className="mt-1 text-sm text-red-600" />
            </Field.Root>

            <Field.Root name="sendToNocfo">
              <Field.Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Checkbox.Root
                  checked={sendToNocfo}
                  onCheckedChange={setSendToNocfo}
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Checkbox.Indicator
                    keepMounted
                    className="flex size-full items-center justify-center data-checked:text-blue-600 data-unchecked:text-white"
                  >
                    <Check className="h-4 w-4" />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                {t('send_to_nocfo')}
              </Field.Label>
            </Field.Root>

            {(failures.length > 0 || status === 'hasErrored') && (
              <div role="alert" className="text-sm text-red-600">
                {failures.length > 0 && <p className="font-medium">{t('failed_entries')}</p>}
                <ul className="list-disc pl-5">
                  {failures.map((f) => (
                    <li key={f.entryIds.join(',')}>{f.reason}</li>
                  ))}
                  {result.serverError && <li>{result.serverError}</li>}
                </ul>
              </div>
            )}

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
