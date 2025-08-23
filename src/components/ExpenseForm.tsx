'use client'

import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Divider, Form, Input, Result, Typography } from 'antd'
import { isValidIBAN } from 'ibantools'
import { useTranslations } from 'next-intl'
import React from 'react'

import { type ExpenseFormData, type FormEntry, useExpenseForm } from '@/hooks/useExpenseForm'
import { Link } from '@/i18n/navigation'
import { env } from '@/lib/env'
import { validateFinnishSSN } from '@/lib/validation'

import { ItemDisplay, MileageDisplay } from './EntryDisplay'
import { ItemForm } from './ItemForm'
import { MileageForm } from './MileageForm'

// Result Component
const FormResult: React.FC<{
  status: 'success' | 'failure'
  onReset: () => void
}> = ({ status, onReset }) => {
  const t = useTranslations('form.main')
  const isSuccess = status === 'success'

  return (
    <Result
      status={isSuccess ? 'success' : 'error'}
      title={t(`${status}.title`)}
      subTitle={t(`${status}.sub_title`)}
      extra={[
        <Button type="primary" key="again" onClick={onReset}>
          {t(isSuccess ? 'success.send_another' : 'failure.try_again')}
        </Button>
      ]}
    />
  )
}

// Entry Renderer Component
const EntryRenderer = ({
  entry,
  onEdit,
  onRemove
}: {
  entry: FormEntry
  onEdit: (id: string) => void
  onRemove: (id: string) => void
}) => {
  const commonProps = {
    onEdit: () => onEdit(entry.id),
    onRemove: () => onRemove(entry.id)
  }

  if (entry.type === 'item') {
    return <ItemDisplay {...commonProps} item={entry.data} />
  }

  return (
    <MileageDisplay
      {...commonProps}
      mileage={entry.data}
      mileageRate={env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE}
    />
  )
}

// Main Component
export function ExpenseForm() {
  const [form] = Form.useForm<ExpenseFormData>()
  const t = useTranslations('form.main')

  const {
    state,
    actionStatus,
    hasMileages,
    total,
    editingEntry,
    handleSubmit,
    openModal,
    closeModal,
    handleAddOrUpdateEntry,
    handleRemoveEntry,
    resetForm
  } = useExpenseForm()

  // Form submit handler
  const onFinish = (values: ExpenseFormData) => {
    handleSubmit(values)
    form.resetFields()
  }

  // Early return for result states
  if (state.status !== 'idle') {
    return <FormResult status={state.status} onReset={resetForm} />
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Form form={form} layout="vertical" onFinish={onFinish} className="space-y-4">
        {/* Basic Information Fields */}
        <Form.Item
          name="name"
          label={t('payee_name')}
          rules={[{ required: true, message: t('payee_name_error') }]}
        >
          <Input placeholder={t('payee_name_placeholder')} maxLength={255} autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="contact"
          label={t('payee_contact')}
          rules={[{ required: true, message: t('payee_contact_error') }]}
        >
          <Input placeholder={t('payee_contact_placeholder')} maxLength={255} autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="iban"
          label={t('iban')}
          rules={[
            {
              required: true,
              validator: (_, value: string) => {
                if (!value) {
                  return Promise.reject(new Error(t('iban_error_1')))
                }
                if (isValidIBAN(value.replace(/\s/g, ''))) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error(t('iban_error_2')))
              }
            }
          ]}
        >
          <Input placeholder={t('iban_placeholder')} autoComplete="off" />
        </Form.Item>

        <Form.Item
          name="title"
          label={t('claim_title')}
          rules={[{ required: true, message: t('claim_title_error') }]}
        >
          <Input.TextArea
            showCount
            placeholder={t('claim_title_placeholder')}
            maxLength={1000}
            autoComplete="off"
            rows={2}
          />
        </Form.Item>

        {hasMileages && (
          <Form.Item
            label={t('personal_id_code')}
            name="govId"
            rules={[
              {
                required: hasMileages,
                message: t('personal_id_code_error')
              },
              {
                validator: (_, value: string) => {
                  if (validateFinnishSSN(value)) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('personal_id_code_invalid')))
                }
              }
            ]}
          >
            <Input
              placeholder={t('personal_id_code_placeholder')}
              disabled={actionStatus === 'executing'}
              maxLength={11}
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>
        )}

        <Divider />

        {/* Entries Section */}
        {state.entries.length > 0 && (
          <div className="mb-4 text-center text-sm text-gray-500">
            <Typography.Text>
              {t('entries_count', {
                items: state.entries.filter((entry) => entry.type === 'item').length,
                mileages: state.entries.filter((entry) => entry.type === 'mileage').length,
                maxItems: 20,
                maxMileages: 20
              })}
            </Typography.Text>
          </div>
        )}
        {state.entries.length > 0 && (
          <div className="mb-6 space-y-4">
            <Typography.Title level={4}>{t('entries')}</Typography.Title>

            {state.entries.map((entry) => (
              <EntryRenderer
                key={entry.id}
                entry={entry}
                onEdit={() => openModal(entry.type, entry.id)}
                onRemove={handleRemoveEntry}
              />
            ))}

            <Card size="small" className="bg-gray-50">
              <div className="flex items-center justify-between">
                <Typography.Text strong>{t('total')}:</Typography.Text>
                <Typography.Text strong className="text-lg">
                  {total.toFixed(2)} €
                </Typography.Text>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-4">
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => openModal('item')}
              disabled={state.entries.filter((entry) => entry.type === 'item').length >= 20}
              title={
                state.entries.filter((entry) => entry.type === 'item').length >= 20
                  ? t('max_items_reached')
                  : undefined
              }
            >
              {t('add_expense')}
            </Button>
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={() => openModal('mileage')}
              disabled={state.entries.filter((entry) => entry.type === 'mileage').length >= 20}
              title={
                state.entries.filter((entry) => entry.type === 'mileage').length >= 20
                  ? t('max_mileages_reached')
                  : undefined
              }
            >
              {t('add_mileage')}
            </Button>
          </div>
          <div>
            <Button
              type="primary"
              htmlType="submit"
              loading={actionStatus === 'executing'}
              size="large"
              disabled={state.entries.length === 0}
            >
              {t('submit')}
            </Button>
          </div>
        </div>

        {/* Modals */}
        {state.modalState.type === 'item' && (
          <ItemForm
            visible={state.modalState.isOpen}
            onOk={(data) =>
              handleAddOrUpdateEntry({
                id: crypto.randomUUID(),
                data,
                type: 'item'
              })
            }
            onCancel={closeModal}
            editData={editingEntry?.type === 'item' ? editingEntry.data : undefined}
          />
        )}

        {state.modalState.type === 'mileage' && (
          <MileageForm
            visible={state.modalState.isOpen}
            onOk={(data) =>
              handleAddOrUpdateEntry({
                id: crypto.randomUUID(),
                data,
                type: 'mileage'
              })
            }
            onCancel={closeModal}
            editData={editingEntry?.type === 'mileage' ? editingEntry.data : undefined}
          />
        )}

        <Divider />

        {/* Privacy Policy */}
        <div className="text-center text-gray-500">
          <Typography.Text>
            {t.rich('privacy_policy', {
              privacy_policy: (chunks) => (
                <Link
                  href={env.NEXT_PUBLIC_PRIVACY_POLICY_URL}
                  className="text-blue-500 hover:text-blue-700"
                >
                  {chunks}
                </Link>
              )
            })}
          </Typography.Text>
        </div>
      </Form>
    </div>
  )
}
