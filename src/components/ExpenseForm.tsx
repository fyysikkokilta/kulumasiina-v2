'use client'

import { Field } from '@base-ui/react/field'
import { Form } from '@base-ui/react/form'
import { Separator } from '@base-ui/react/separator'
import { friendlyFormatIBAN, isValidIBAN } from 'ibantools'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Required } from '@/components/ui/Required'
import { Link } from '@/i18n/navigation'
import { createEntryAction } from '@/lib/actions/createEntry'
import type { FormEntry } from '@/lib/db/schema'
import { env } from '@/lib/env'
import { calculateFormEntriesTotal } from '@/utils/entry-total-utils'
import { isEntryItem, isEntryMileage } from '@/utils/entry-utils'
import { inputClass, textareaClass } from '@/utils/form-styles'
import { validateFinnishSSN } from '@/utils/validation'

import { ItemDisplay, MileageDisplay } from './EntryDisplay'
import { FormResult } from './FormResult'
import { ItemForm } from './ItemForm'
import { MileageForm } from './MileageForm'

const NEW_ITEM_ID = 'new-item'
const NEW_MILEAGE_ID = 'new-mileage'

export function ExpenseForm() {
  const t = useTranslations('ExpenseForm')

  const [status, setStatus] = useState<'idle' | 'success' | 'failure'>('idle')
  const [entries, setEntries] = useState<FormEntry[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)

  const { execute, status: actionStatus } = useAction(createEntryAction, {
    onSuccess: () => {
      setStatus('success')
    },
    onError: (error) => {
      console.error('Form submission error:', error)
      setStatus('failure')
    }
  })

  const hasMileages = entries.some(isEntryMileage)

  const mainFormSchema = z
    .object({
      name: z.string().min(1, t('errors.payee_name')).max(255),
      contact: z.string().min(1, t('errors.payee_contact')).max(255),
      iban: z
        .string()
        .min(1, t('errors.iban_required'))
        .refine((val) => isValidIBAN(val.replace(/\s/g, '')), t('errors.iban_invalid')),
      title: z.string().min(1, t('errors.claim_title')).max(1000),
      govId: z
        .string()
        .refine((val) => !val || validateFinnishSSN(val), t('errors.personal_id_code_invalid'))
        .optional(),
      // No need to validate items and mileages, they are validated in their forms
      items: z.array(z.any()),
      mileages: z.array(z.any())
    })
    .refine((data) => data.items.length > 0 || data.mileages.length > 0, {
      message: t('errors.no_entries'),
      path: ['items', 'mileages']
    })
    .refine((data) => data.mileages.length === 0 || !!data.govId, {
      message: t('errors.personal_id_code_required'),
      path: ['govId']
    })

  const total = calculateFormEntriesTotal(
    entries.filter(isEntryItem).map((e) => e),
    entries.filter(isEntryMileage).map((e) => e)
  )
  const editingEntry = editingId ? (entries.find((entry) => entry.id === editingId) ?? null) : null

  const openModal = (editingId: string | null) => {
    setEditingId(editingId)
  }

  const closeModal = () => {
    setEditingId(null)
  }

  const handleAddOrUpdateEntry = (data: FormEntry) => {
    setEntries((prev) => {
      const newEntries = [...prev]
      if (editingId && editingId !== NEW_ITEM_ID && editingId !== NEW_MILEAGE_ID) {
        const index = newEntries.findIndex((e) => e.id === editingId)
        if (index !== -1) newEntries[index] = { ...newEntries[index], ...data }
      } else {
        const typeCount = newEntries.filter(isEntryItem(data) ? isEntryItem : isEntryMileage).length
        if (typeCount >= 20) return prev
        newEntries.push({ ...data, id: crypto.randomUUID() })
      }
      return newEntries
    })
    setEditingId(null)
  }

  const [errors, setErrors] = useState<Record<string, string | string[]> | undefined>(undefined)
  const formRef = useRef<HTMLFormElement>(null)

  const resetForm = () => {
    setErrors(undefined)
    formRef.current?.reset()
    setStatus('idle')
    setEntries([])
    setEditingId(null)
  }

  const handleFormSubmit = async (formValues: Record<string, string | number>) => {
    if (actionStatus === 'executing') return

    const toParse = {
      name: formValues.name,
      contact: formValues.contact,
      iban: friendlyFormatIBAN(String(formValues.iban ?? '').replace(/\s/g, '')),
      title: formValues.title,
      govId: formValues.govId ?? (hasMileages ? '' : undefined),
      items: entries.filter(isEntryItem),
      mileages: entries.filter(isEntryMileage)
    }

    const result = mainFormSchema.safeParse(toParse)

    if (!result.success) {
      setErrors(z.flattenError(result.error).fieldErrors)
      return
    }

    execute({
      name: result.data.name,
      contact: result.data.contact,
      govId: result.data.govId,
      title: result.data.title,
      iban: result.data.iban,
      items: result.data.items,
      mileages: result.data.mileages
    })

    setErrors(undefined)
  }

  // Early return for result states
  if (status !== 'idle') {
    return <FormResult status={status} onReset={resetForm} />
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Form ref={formRef} onFormSubmit={handleFormSubmit} errors={errors} className="space-y-4">
        {/* Basic Information Fields */}
        <Field.Root name="name">
          <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('payee_name')}
            <Required />
          </Field.Label>
          <Field.Control
            placeholder={t('payee_name_placeholder')}
            maxLength={255}
            autoComplete="off"
            className={inputClass}
          />
          <Field.Error className="mt-1 text-sm text-red-600" />
        </Field.Root>

        <Field.Root name="contact">
          <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('payee_contact')}
            <Required />
          </Field.Label>
          <Field.Control
            placeholder={t('payee_contact_placeholder')}
            maxLength={255}
            autoComplete="off"
            className={inputClass}
          />
          <Field.Error className="mt-1 text-sm text-red-600" />
        </Field.Root>

        <Field.Root name="iban">
          <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('iban')}
            <Required />
          </Field.Label>
          <Field.Control
            placeholder={t('iban_placeholder')}
            autoComplete="off"
            className={inputClass}
          />
          <Field.Error className="mt-1 text-sm text-red-600" />
        </Field.Root>

        <Field.Root name="title">
          <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('claim_title')}
            <Required />
          </Field.Label>
          <Field.Control
            render={
              <textarea
                placeholder={t('claim_title_placeholder')}
                maxLength={1000}
                autoComplete="off"
                rows={2}
                className={textareaClass}
              />
            }
          />
          <Field.Error className="mt-1 text-sm text-red-600" />
        </Field.Root>

        {hasMileages && (
          <Field.Root name="govId">
            <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('personal_id_code')}
              <Required />
            </Field.Label>
            <Field.Control
              placeholder={t('personal_id_code_placeholder')}
              maxLength={11}
              className={inputClass}
              autoComplete="off"
              onChange={(e) => {
                const input = e.currentTarget
                input.value = e.target.value.toUpperCase()
              }}
            />
            <Field.Error className="mt-1 text-sm text-red-600" />
          </Field.Root>
        )}

        <Separator className="my-4" />

        {errors?.items && (
          <p className="mb-4 text-sm text-red-600">
            {Array.isArray(errors.items) ? errors.items[0] : errors.items}
          </p>
        )}
        {errors?.mileages && (
          <p className="mb-4 text-sm text-red-600">
            {Array.isArray(errors.mileages) ? errors.mileages[0] : errors.mileages}
          </p>
        )}

        {/* Entries Section */}
        {entries.length > 0 && (
          <div className="mb-4 text-center text-sm text-gray-500">
            <span>
              {t('entries_count', {
                items: entries.filter(isEntryItem).length.toString(),
                mileages: entries.filter(isEntryMileage).length.toString(),
                maxItems: '20',
                maxMileages: '20'
              })}
            </span>
          </div>
        )}
        {entries.length > 0 && (
          <div className="mb-6 space-y-4">
            <h4 className="text-lg font-semibold">{t('entries')}</h4>

            {entries.map((entry) =>
              isEntryItem(entry) ? (
                <ItemDisplay
                  onEdit={() => openModal(entry.id ?? null)}
                  onRemove={() => setEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                  key={entry.id}
                  item={entry}
                />
              ) : (
                <MileageDisplay
                  onEdit={() => openModal(entry.id ?? null)}
                  onRemove={() => setEntries((prev) => prev.filter((e) => e.id !== entry.id))}
                  key={entry.id}
                  mileage={entry}
                  mileageRate={env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE}
                />
              )
            )}

            <Card size="small" className="bg-gray-50">
              <div className="flex items-center justify-between">
                <strong>{`${t('total')}:`}</strong>
                <strong className="text-lg">{`${total.toFixed(2)} €`}</strong>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => openModal(NEW_ITEM_ID)}
              disabled={entries.filter((entry) => 'attachments' in entry).length >= 20}
              title={
                entries.filter((entry) => 'attachments' in entry).length >= 20
                  ? t('max_items_reached')
                  : undefined
              }
            >
              <Plus className="h-4 w-4" />
              {t('add_expense')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => openModal(NEW_MILEAGE_ID)}
              disabled={entries.filter((entry) => 'distance' in entry).length >= 20}
              title={
                entries.filter((entry) => 'distance' in entry).length >= 20
                  ? t('max_mileages_reached')
                  : undefined
              }
            >
              <Plus className="h-4 w-4" />
              {t('add_mileage')}
            </Button>
          </div>
          <div>
            <Button
              type="submit"
              variant="primary"
              actionStatus={actionStatus}
              disabled={actionStatus === 'executing' || entries.length === 0}
            >
              {t('submit')}
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Privacy Policy */}
        <div className="text-center text-gray-500">
          <span>
            {t.rich('privacy_policy', {
              privacy_policy: (chunks: ReactNode) => (
                <Link
                  href={env.NEXT_PUBLIC_PRIVACY_POLICY_URL}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {chunks}
                </Link>
              )
            })}
          </span>
        </div>
      </Form>

      {/* Modals rendered outside main form so Enter/OK only submit the modal form */}
      <ItemForm
        visible={isEntryItem(editingEntry) || editingId === NEW_ITEM_ID}
        onOk={(data) =>
          handleAddOrUpdateEntry({
            id: editingEntry?.id,
            ...data
          })
        }
        onCancel={closeModal}
        editData={isEntryItem(editingEntry) ? editingEntry : null}
      />

      <MileageForm
        visible={isEntryMileage(editingEntry) || editingId === NEW_MILEAGE_ID}
        onOk={(data) =>
          handleAddOrUpdateEntry({
            id: editingEntry?.id,
            ...data
          })
        }
        onCancel={closeModal}
        editData={isEntryMileage(editingEntry) ? editingEntry : null}
      />
    </div>
  )
}
