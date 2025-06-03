'use client'

import { Button, DatePicker, Form, Input, Modal, Space } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import React from 'react'

import { approveEntriesAction } from '@/lib/actions/approveEntries'

interface ApproveModalProps {
  visible: boolean
  onCancel: () => void
  entryIds: number[]
  onSuccess?: () => void
}

interface ApproveFormData {
  date: Dayjs
  approvalNote: string
}

export function ApproveModal({ visible, onCancel, entryIds, onSuccess }: ApproveModalProps) {
  const [form] = Form.useForm<ApproveFormData>()
  const t = useTranslations('admin.approve_modal')

  const { execute, status } = useAction(approveEntriesAction, {
    onSuccess: () => {
      form.resetFields()
      onSuccess?.()
      onCancel()
    }
  })

  const handleSubmit = (values: ApproveFormData) => {
    execute({
      ids: entryIds,
      date: values.date.toDate(),
      approval_note: values.approvalNote
    })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal title={t('title')} open={visible} footer={null} onCancel={handleCancel}>
      <Form form={form} onFinish={handleSubmit} initialValues={{ date: dayjs() }} layout="vertical">
        <Form.Item
          name="date"
          label={t('date')}
          rules={[{ required: true, message: t('date_error') }]}
        >
          <DatePicker format="DD.MM.YYYY" className="w-full" />
        </Form.Item>

        <Form.Item
          name="approvalNote"
          label={t('approval_note')}
          rules={[
            {
              required: true,
              message: t('approval_note_error')
            }
          ]}
        >
          <Input placeholder={t('approval_note_placeholder')} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={status === 'executing'}>
              {t('submit')}
            </Button>
            <Button onClick={handleCancel}>{t('cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
