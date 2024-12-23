import React from 'react'
import { Modal, Form, Button, Typography } from 'antd'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { hideRemoveEntriesModal } from './adminSlice'
import { deleteOldArchivedEntries } from './api'
import { loadItems } from './EntryView'
import { useTranslation } from 'react-i18next'
export const RemoveEntriesModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation('translation', {
    keyPrefix: 'admin.remove_archived_entries_modal',
  })
  const show = useAppSelector((state) => state.admin.removeEntriesModal)

  const handleSubmit = () => {
    deleteOldArchivedEntries()
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideRemoveEntriesModal()))
  }
  return (
    <>
      <Modal
        title={t('title')}
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideRemoveEntriesModal())}
      >
        <Form onFinish={handleSubmit}>
          <Form.Item>
            <Typography.Paragraph type="danger">
              {t('text_1')}
            </Typography.Paragraph>
            <Typography.Paragraph>{t('text_2')}</Typography.Paragraph>
          </Form.Item>
          <Form.Item>
            <Button danger type="primary" htmlType="submit">
              {t('remove')}
            </Button>
            <Button
              key="cancel"
              onClick={() => dispatch(hideRemoveEntriesModal())}
            >
              {t('cancel')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default RemoveEntriesModal
