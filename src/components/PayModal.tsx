'use client'

import { Button, DatePicker, Form, Modal, Space } from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'

import { payEntriesAction } from '@/lib/actions/payEntries'

interface PayModalProps {
  visible: boolean
  onCancel: () => void
  entryIds: string[]
  onSuccess?: () => void
}

interface PayFormData {
  date: Dayjs
}

export function PayModal({
  visible,
  onCancel,
  entryIds,
  onSuccess
}: PayModalProps) {
  const [form] = Form.useForm<PayFormData>()
  const t = useTranslations('admin.pay_modal')

  const { execute, status } = useAction(payEntriesAction, {
    onSuccess: () => {
      form.resetFields()
      onSuccess?.()
      onCancel()
    }
  })

  const handleSubmit = (values: PayFormData) => {
    execute({
      ids: entryIds,
      date: values.date.toDate()
    })
  }

  const handleCancel = () => {
    form.resetFields()
    onCancel()
  }

  return (
    <Modal
      title={t('title')}
      open={visible}
      footer={null}
      onCancel={handleCancel}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        initialValues={{ date: dayjs() }}
        layout="vertical"
      >
        <Form.Item
          name="date"
          label={t('date')}
          rules={[{ required: true, message: t('date_error') }]}
        >
          <DatePicker format="DD.MM.YYYY" className="w-full" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={status === 'executing'}
            >
              {t('submit')}
            </Button>
            <Button onClick={handleCancel}>{t('cancel')}</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  )
}
