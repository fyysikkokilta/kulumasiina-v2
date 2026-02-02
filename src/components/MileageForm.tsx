'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Field } from '@base-ui/react/field'
import { Form } from '@base-ui/react/form'
import { NumberField } from '@base-ui/react/number-field'
import { X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { z } from 'zod'

import { EntryCommonFields } from '@/components/EntryCommonFields'
import { Button } from '@/components/ui/Button'
import { Required } from '@/components/ui/Required'
import type { FormMileage } from '@/lib/db/schema'
import { inputClass, textareaClass } from '@/utils/form-styles'

interface MileageFormProps {
  visible: boolean
  onOk: (mileage: FormMileage) => void
  onCancel: () => void
  editData?: FormMileage
  isSubmitting?: boolean
}

export function MileageForm({
  visible,
  onOk,
  onCancel,
  editData,
  isSubmitting = false
}: MileageFormProps) {
  const t = useTranslations('MileageForm')
  const locale = useLocale()
  const [errors, setErrors] = useState<
    Record<string, string | string[]> | undefined
  >(undefined)

  const formRef = useRef<HTMLFormElement>(null)

  const mileageFormSchema = z.object({
    description: z.string().min(1, t('errors.description')).max(500),
    date: z
      .union([z.date(), z.string().min(1, t('errors.date'))])
      .transform((val): Date => {
        if (val instanceof Date) return val
        return new Date((val as string) + 'T00:00:00')
      })
      .refine((d) => !Number.isNaN(d.getTime()), t('errors.date')),
    route: z.string().min(1, t('errors.route')).max(500),
    distance: z.coerce
      .number()
      .refine((val) => val > 0, t('errors.distance_invalid')),
    plateNo: z
      .string()
      .min(1, t('errors.plate_number'))
      .max(12)
      .regex(/^[A-Za-zÅÄÖåäö0-9-]*$/, t('errors.plate_number_invalid'))
      .transform((val) => val.toUpperCase()),
    account: z
      .string()
      .max(4, t('errors.account_invalid'))
      .regex(/^[0-9]{0,4}$/, t('errors.account_invalid'))
      .nullish()
  })

  const handleFormSubmit = async (
    formValues: Record<string, string | number>
  ) => {
    if (isSubmitting) return

    const result = mileageFormSchema.safeParse(formValues)

    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors)
      return
    }

    setErrors({})
    onOk(result.data)
    formRef.current?.reset()
  }

  const resetForm = () => {
    formRef.current?.reset()
    setErrors({})
    onCancel()
  }

  return (
    <Dialog.Root open={visible} onOpenChange={(open) => !open && resetForm()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
        <Dialog.Popup
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg"
          style={{
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
        >
          <Dialog.Title className="mb-4 text-lg font-semibold">
            {editData ? t('edit') : t('add')}
          </Dialog.Title>
          <Form
            ref={formRef}
            id="mileage-form"
            errors={errors}
            onFormSubmit={handleFormSubmit}
            className="mb-4 space-y-4"
          >
            <EntryCommonFields
              t={t as (key: string) => string}
              defaultDescription={editData?.description}
              defaultDate={
                editData?.date
                  ? new Date(editData.date).toISOString().slice(0, 10)
                  : undefined
              }
              defaultAccount={editData?.account ?? null}
            />

            <Field.Root name="route">
              <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
                {t('route')}
                <Required />
              </Field.Label>
              <Field.Control
                render={
                  <textarea
                    className={textareaClass}
                    rows={2}
                    maxLength={500}
                    placeholder={t('route_placeholder')}
                    defaultValue={editData?.route}
                  />
                }
              />
              <Field.Error className="mt-1 text-sm text-red-600" />
            </Field.Root>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field.Root name="distance">
                <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('distance')}
                  <Required />
                </Field.Label>
                <NumberField.Root
                  defaultValue={editData?.distance ?? undefined}
                  min={0}
                  max={1000000}
                  step="any"
                  locale={locale}
                  className="w-full"
                >
                  <NumberField.Input
                    placeholder={t('distance_placeholder')}
                    className={`${inputClass} pr-12`}
                  />
                </NumberField.Root>
                <Field.Error className="mt-1 text-sm text-red-600" />
              </Field.Root>

              <Field.Root name="plateNo">
                <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('plate_number')}
                  <Required />
                </Field.Label>
                <Field.Control
                  defaultValue={editData?.plateNo}
                  placeholder={t('plate_number_placeholder')}
                  className={inputClass}
                />
                <Field.Error className="mt-1 text-sm text-red-600" />
              </Field.Root>
            </div>
          </Form>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={resetForm}>
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              form="mileage-form"
              onClick={() => formRef.current?.requestSubmit()}
              variant="primary"
              actionStatus={isSubmitting ? 'executing' : 'idle'}
              disabled={isSubmitting}
            >
              {t('ok')}
            </Button>
          </div>
          <Dialog.Close
            className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            onClick={resetForm}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">{t('close')}</span>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
