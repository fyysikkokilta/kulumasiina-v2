'use client'

import { Checkbox } from '@base-ui/react/checkbox'
import { Dialog } from '@base-ui/react/dialog'
import { Field } from '@base-ui/react/field'
import { Form } from '@base-ui/react/form'
import { NumberField } from '@base-ui/react/number-field'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { HookActionStatus, useAction } from 'next-safe-action/hooks'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { EntryCommonFields } from '@/components/EntryCommonFields'
import { PreviewModal } from '@/components/PreviewModal'
import { Button } from '@/components/ui/Button'
import { Required } from '@/components/ui/Required'
import { uploadAttachmentAction } from '@/lib/actions/uploadAttachment'
import type { FormItemWithAttachments } from '@/lib/db/schema'
import { inputClass } from '@/utils/form-styles'
import {
  prepareAttachmentPreview,
  type PreviewState
} from '@/utils/preview-utils'

const MAX_ATTACHMENT_SIZE_BYTES = 8 * 1024 * 1024 // 8 MB

interface ItemFormProps {
  visible: boolean
  onOk: (item: FormItemWithAttachments) => void
  onCancel: () => void
  editData: FormItemWithAttachments | null
  submittingStatus?: HookActionStatus
}

export function ItemForm({
  visible,
  onOk,
  onCancel,
  editData,
  submittingStatus
}: ItemFormProps) {
  const t = useTranslations('ItemForm')
  const locale = useLocale()
  const [errors, setErrors] = useState<
    Record<string, string | string[]> | undefined
  >(undefined)

  const formRef = useRef<HTMLFormElement>(null)
  const addFileInputRef = useRef<HTMLInputElement>(null)

  type AttachmentSlot = {
    fileId: string
    filename: string
  }
  const [attachments, setAttachments] = useState<AttachmentSlot[]>(
    editData?.attachments.map((a) => ({
      fileId: a.fileId,
      filename: a.filename
    })) ?? []
  )

  const [previewState, setPreviewState] = useState<PreviewState | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    queueMicrotask(() => {
      setErrors(undefined)
      setUploadError(null)
      setPreviewState(null)
      setAttachments(
        editData?.attachments?.map((a) => ({
          fileId: a.fileId,
          filename: a.filename
        })) ?? []
      )
    })
  }, [editData, visible])

  const { execute: uploadFileAction, status: uploadFileStatus } = useAction(
    uploadAttachmentAction,
    {
      onSuccess: (result) => {
        setUploadError(null)
        if (result?.data) {
          setAttachments((prev) => [
            ...prev,
            { fileId: result.data.fileId, filename: result.data.filename }
          ])
        }
      },
      onError: () => {
        setUploadError(t('errors.upload_failed'))
      }
    }
  )

  const openPreview = async (slot: AttachmentSlot) => {
    const isNotReceipt =
      (
        formRef.current?.elements.namedItem(
          `attachments[${slot.fileId}].isNotReceipt`
        ) as HTMLInputElement
      )?.checked ?? false
    const value = Number(
      (
        formRef.current?.elements.namedItem(
          `attachments[${slot.fileId}].value`
        ) as HTMLInputElement
      )?.value ?? null
    )
    setPreviewState(
      prepareAttachmentPreview({
        fileId: slot.fileId,
        filename: slot.filename,
        isNotReceipt,
        value
      })
    )
  }

  const itemFormSchema = z.object({
    description: z.string().min(1, t('errors.description')).max(500),
    date: z.iso.date(t('errors.date')).transform((val) => new Date(val)),
    account: z
      .string()
      .max(4, t('errors.account_invalid'))
      .regex(/^[0-9]{0,4}$/, t('errors.account_invalid'))
      .nullish(),
    attachments: z
      .array(
        z.object({
          fileId: z.uuid(),
          filename: z.string().min(1).max(255),
          value: z
            .number()
            .nullish()
            .refine((val) => !val || val > 0, t('errors.value_min'))
            .refine((val) => !val || val <= 1000000, t('errors.value_max')),
          isNotReceipt: z.boolean().default(false)
        })
      )
      .min(1, t('errors.attachments_min'))
      .max(20, t('errors.attachments_max'))
      .refine(
        (val) => val.some((a) => !!a.value && !a.isNotReceipt),
        t('errors.at_least_one_value')
      )
  })

  const handleFormSubmit = async (
    formValues: Record<string, string | number | boolean>
  ) => {
    if (submittingStatus === 'executing' || uploadFileStatus === 'executing') {
      return
    }

    const parsedAttachments = attachments.map((slot) => {
      const value = formValues[`attachments[${slot.fileId}].value`]
        ? Number.parseFloat(
            String(formValues[`attachments[${slot.fileId}].value`])
          )
        : undefined
      const isNotReceipt =
        formValues[`attachments[${slot.fileId}].isNotReceipt`] ?? false
      return {
        fileId: slot.fileId,
        filename: slot.filename,
        value: isNotReceipt ? null : value,
        isNotReceipt
      }
    })

    const toParse = {
      description: formValues.description,
      date: formValues.date,
      account: formValues.account ?? null,
      attachments: parsedAttachments
    }

    const result = itemFormSchema.safeParse(toParse)
    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors)
      return
    }

    setErrors(undefined)
    setUploadError(null)
    onOk(result.data)
    formRef.current?.reset()
    setAttachments([])
  }

  const resetForm = () => {
    formRef.current?.reset()
    setErrors(undefined)
    setUploadError(null)
    setAttachments([])
    onCancel()
  }

  return (
    <>
      <PreviewModal
        previewState={previewState}
        closePreview={() => setPreviewState(null)}
      />
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
              id="item-form"
              // Reset form when edit data changes
              key={editData?.id ?? ''}
              errors={errors}
              onFormSubmit={handleFormSubmit}
              className="mb-4 space-y-4"
            >
              <EntryCommonFields
                defaultDescription={editData?.description}
                defaultDate={
                  editData?.date
                    ? new Date(editData.date).toISOString().slice(0, 10)
                    : undefined
                }
                defaultAccount={editData?.account ?? null}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  {t('attachments')}
                  <Required />
                </label>
                <p className="mb-3 text-xs text-gray-500">
                  {t('attachments_help')}
                </p>

                {errors?.attachments && (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {typeof errors.attachments === 'string'
                      ? errors.attachments
                      : errors.attachments[0]}
                  </p>
                )}

                {attachments.map((slot, i) => (
                  <div
                    key={slot.fileId}
                    className="mt-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3"
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto_auto] sm:items-end">
                      <div>
                        <span className="mb-1 block text-xs font-medium text-gray-600">
                          {t('attachment_file')}
                        </span>
                        <Button
                          type="button"
                          onClick={() => openPreview(slot)}
                          variant="secondary"
                          title={t('preview_file')}
                          aria-label={`${slot.filename ?? ''} ${t('preview_file')}`}
                        >
                          {slot.filename ?? ''}
                        </Button>
                      </div>
                      <Field.Root name={`attachments[${slot.fileId}].value`}>
                        <Field.Label className="mb-1 block text-xs font-medium text-gray-600">
                          {t('attachment_value')}
                        </Field.Label>
                        <div className="relative flex items-center">
                          <NumberField.Root
                            step={0.01}
                            min={0}
                            max={1000000}
                            locale={locale}
                            className="w-full"
                            defaultValue={
                              editData?.attachments?.[i]?.value ?? undefined
                            }
                          >
                            <NumberField.Input
                              placeholder={t('value_placeholder')}
                              className={`${inputClass} pr-12`}
                            />
                          </NumberField.Root>
                          <span className="absolute right-3 text-sm text-gray-500">
                            {t('value_unit')}
                          </span>
                        </div>
                        <Field.Error className="mt-1 text-sm text-red-600" />
                      </Field.Root>
                      <Field.Root
                        name={`attachments[${slot.fileId}].isNotReceipt`}
                      >
                        <Field.Label className="mb-1 block text-xs font-medium text-gray-600">
                          {t('is_not_receipt')}
                        </Field.Label>
                        <Checkbox.Root
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          defaultChecked={
                            editData?.attachments?.[i]?.isNotReceipt ?? false
                          }
                        >
                          <Checkbox.Indicator
                            keepMounted
                            className="flex size-full h-5 w-5 items-center justify-center data-checked:text-blue-600 data-unchecked:text-white"
                          >
                            <Check className="h-6 w-6" />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <Field.Error className="mt-1 text-sm text-red-600" />
                      </Field.Root>
                      <Button
                        type="button"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((s) => s.fileId !== slot.fileId)
                          )
                        }
                        variant="danger"
                        size="small"
                        aria-label={t('remove_attachment')}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {attachments.length < 20 && (
                  <div className="mt-3 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <input
                        ref={addFileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        className="sr-only"
                        aria-hidden
                        tabIndex={-1}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
                            setUploadError(t('errors.file_too_large'))
                            e.target.value = ''
                            return
                          }
                          setUploadError(null)
                          uploadFileAction({
                            file,
                            mimeType: file.type
                          })
                          e.target.value = ''
                        }}
                      />
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => addFileInputRef.current?.click()}
                        actionStatus={uploadFileStatus}
                      >
                        <Plus className="h-4 w-4" />
                        {t('upload')}
                      </Button>
                    </div>
                    {(uploadFileStatus === 'hasErrored' || uploadError) && (
                      <p className="text-sm text-red-600" role="alert">
                        {uploadError ?? t('errors.upload_failed')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Form>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                {t('cancel')}
              </Button>
              <Button
                type="submit"
                form="item-form"
                onClick={() => formRef.current?.requestSubmit()}
                variant="primary"
                actionStatus={submittingStatus}
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
    </>
  )
}
