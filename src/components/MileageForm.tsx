'use client'

import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd'
import { Dayjs } from 'dayjs'
import { useLocale, useTranslations } from 'next-intl'
import React, { useCallback, useEffect } from 'react'

import { useMileageForm } from '@/hooks/useMileageForm'
import { bookkeepingAccounts } from '@/lib/bookkeeping-accounts'
import type { Mileage, NewMileage } from '@/lib/db/schema'

export interface MileageFormData {
  description: string
  date: Dayjs
  route: string
  distance: number
  plateNo: string
  account: string
}

interface MileageFormProps {
  visible: boolean
  onOk: (mileage: Omit<NewMileage, 'entryId'>) => void
  onCancel: () => void
  editData?: Omit<Mileage | NewMileage, 'entryId'>
}

export function MileageForm({ visible, onOk, onCancel, editData }: MileageFormProps) {
  const [form] = Form.useForm<MileageFormData>()
  const t = useTranslations('form.mileage')
  const locale = useLocale()

  const { loadExistingMileage, saveMileage, resetForm } = useMileageForm(form)

  // Load existing data when editing
  useEffect(() => {
    if (editData && visible) {
      loadExistingMileage(editData)
    } else if (!visible) {
      resetForm()
    }
  }, [editData, visible, loadExistingMileage, resetForm])

  // Handle form submission
  const handleOk = useCallback(async () => {
    const result = await saveMileage()
    if (result) {
      onOk(result)
      setTimeout(() => {
        resetForm()
      }, 500)
    }
  }, [saveMileage, onOk, resetForm])

  // Handle modal cancel
  const handleCancel = useCallback(() => {
    onCancel()
    setTimeout(() => {
      resetForm()
    }, 500)
  }, [resetForm, onCancel])

  return (
    <Modal
      title={editData ? t('edit') : t('add')}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={800}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="description"
          label={t('description')}
          rules={[{ required: true, message: t('description_error') }]}
        >
          <Input.TextArea
            showCount
            maxLength={500}
            rows={3}
            placeholder={t('description_placeholder')}
          />
        </Form.Item>

        <Form.Item
          name="date"
          label={t('date')}
          rules={[{ required: true, message: t('date_error') }]}
        >
          <DatePicker format="DD.MM.YYYY" className="w-full" />
        </Form.Item>

        <Form.Item
          name="route"
          label={t('route')}
          rules={[{ required: true, message: t('route_error') }]}
        >
          <Input.TextArea showCount maxLength={500} rows={2} placeholder={t('route_placeholder')} />
        </Form.Item>

        <Form.Item
          name="distance"
          label={t('distance')}
          rules={[
            { required: true, message: t('distance_error_1') },
            {
              pattern: /^(?!0+(?:[.,]0+)?$)\d+([.,]\d{1,2})?$/,
              message: t('distance_error_2')
            }
          ]}
        >
          <InputNumber
            placeholder={t('distance_placeholder')}
            inputMode="decimal"
            decimalSeparator=","
            suffix={t('distance_unit')}
            step="0.01"
            min={0}
            max={1000000}
            lang={locale}
          />
        </Form.Item>

        <Form.Item
          name="plateNo"
          label={t('plate_number')}
          rules={[{ required: true, message: t('plate_number_error') }]}
        >
          <Input placeholder={t('plate_number_placeholder')} />
        </Form.Item>

        <Form.Item name="account" label={t('account')}>
          <Select
            showSearch
            placeholder={t('account_placeholder')}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={bookkeepingAccounts.map((account) => ({
              value: account.value,
              label: account.label
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
