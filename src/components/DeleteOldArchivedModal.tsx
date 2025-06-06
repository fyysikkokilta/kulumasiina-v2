import { Button, Form, Modal, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'

import { deleteOldArchivedEntriesAction } from '@/lib/actions/deleteOldArchivedEntries'

interface DeleteOldArchivedModalProps {
  visible: boolean
  onCancel: () => void
  onSuccess: () => void
}

export function DeleteOldArchivedModal({
  visible,
  onCancel,
  onSuccess
}: DeleteOldArchivedModalProps) {
  const t = useTranslations('admin.delete_archived_modal')

  const { execute: deleteOldArchivedEntries } = useAction(deleteOldArchivedEntriesAction, {
    onSuccess: () => {
      onSuccess()
    },
    onError: (error) => {
      console.error(error)
    }
  })

  const handleSubmit = () => {
    deleteOldArchivedEntries()
  }

  return (
    <Modal title={t('title')} open={visible} footer={null} onCancel={onCancel}>
      <Form onFinish={handleSubmit}>
        <Form.Item>
          <Typography.Paragraph type="danger">{t('text_1')}</Typography.Paragraph>
          <Typography.Paragraph>{t('text_2')}</Typography.Paragraph>
        </Form.Item>
        <Form.Item>
          <Button danger type="primary" htmlType="submit">
            {t('remove')}
          </Button>
          <Button key="cancel" onClick={onCancel}>
            {t('cancel')}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}
