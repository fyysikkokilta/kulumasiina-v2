import React from 'react'
import { Modal, Form, DatePicker, Button, Input } from 'antd'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { hideDateModal as hideApproveModal } from './adminSlice'
import { approveEntries, approveEntry } from './api'
import { loadItems } from './EntryView'
import dayjs, { Dayjs } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useTranslation } from 'react-i18next'
dayjs.extend(utc)

export const SubmitDateModal: React.FC<{ entry_ids: number | number[] }> = ({
  entry_ids,
}) => {
  const dispatch = useAppDispatch()
  const { t } = useTranslation('translation', {
    keyPrefix: 'admin.accept_modal',
  })
  const show = useAppSelector((state) => state.admin.dateModal)

  const handleSubmit = (values: { date: Dayjs; approvalNote: string }) => {
    const date = values.date.utcOffset(0).startOf('day').toISOString()
    const note = values.approvalNote
    const promise = Array.isArray(entry_ids)
      ? approveEntries(entry_ids, date, note)
      : approveEntry(entry_ids, date, note)
    promise
      .then(() => loadItems(dispatch))
      .then(() => dispatch(hideApproveModal()))
  }
  const now = dayjs()
  return (
    <>
      <Modal
        title={t('title')}
        open={show}
        footer={[]}
        onCancel={() => dispatch(hideApproveModal())}
      >
        <Form onFinish={handleSubmit} initialValues={{ date: now }}>
          <Form.Item
            name="date"
            label={t('date')}
            rules={[{ required: true, message: t('date_error') }]}
          >
            <DatePicker />
          </Form.Item>
          <Form.Item
            name="approvalNote"
            label={t('approval_note')}
            rules={[
              {
                required: true,
                message: t('approval_note_error'),
              },
            ]}
          >
            <Input type="text" placeholder={t('approval_note_placeholder')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {t('submit')}
            </Button>
            <Button key="cancel" onClick={() => dispatch(hideApproveModal())}>
              {t('cancel')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default SubmitDateModal
