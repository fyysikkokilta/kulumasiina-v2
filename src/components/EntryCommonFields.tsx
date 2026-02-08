'use client'

import { Field } from '@base-ui/react/field'
import { Input } from '@base-ui/react/input'
import { useTranslations } from 'next-intl'

import { AccountSelect } from '@/components/AccountSelect'
import { Required } from '@/components/ui/Required'
import { inputClass, textareaClass } from '@/utils/form-styles'

export interface EntryCommonFieldsProps {
  defaultDescription?: string
  defaultDate?: string
  defaultAccount?: string | null
}

export function EntryCommonFields({
  defaultDescription,
  defaultDate,
  defaultAccount
}: EntryCommonFieldsProps) {
  const t = useTranslations('EntryCommonFields')
  return (
    <>
      <Field.Root name="description">
        <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('description')}
          <Required />
        </Field.Label>
        <Field.Control
          render={
            <textarea
              className={textareaClass}
              rows={3}
              maxLength={500}
              placeholder={t('description_placeholder')}
              defaultValue={defaultDescription}
            />
          }
        />
        <Field.Error className="mt-1 text-sm text-red-600" />
      </Field.Root>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field.Root name="date">
          <Field.Label className="mb-1.5 block text-sm font-medium text-gray-700">
            {t('date')}
            <Required />
          </Field.Label>
          <Input
            type="date"
            defaultValue={defaultDate}
            placeholder={t('select_date')}
            className={inputClass}
          />
          <Field.Error className="mt-1 text-sm text-red-600" />
        </Field.Root>

        <Field.Root name="account">
          <Field.Label
            className="mb-1.5 block text-sm font-medium text-gray-700"
            nativeLabel={false}
            render={<div />}
          >
            {t('account')}
          </Field.Label>
          <AccountSelect placeholder={t('select')} defaultValue={defaultAccount ?? undefined} />
          <Field.Description className="mt-1 text-sm text-gray-500">
            {t('account_placeholder')}
          </Field.Description>
        </Field.Root>
      </div>
    </>
  )
}
