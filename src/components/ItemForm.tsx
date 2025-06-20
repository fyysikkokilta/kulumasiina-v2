'use client'

import { PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Typography,
  Upload
} from 'antd'
import type { UploadFile } from 'antd/es/upload/interface'
import { Dayjs } from 'dayjs'
import { useLocale, useTranslations } from 'next-intl'
import React, { useCallback, useEffect } from 'react'

import { useItemForm } from '@/hooks/useItemForm'
import { bookkeepingAccounts } from '@/lib/bookkeeping-accounts'
import type { ItemWithAttachments, NewItemWithAttachments } from '@/lib/db/schema'

import { PreviewModal } from './PreviewModal'

export interface ItemFormData {
  description: string
  date: Dayjs
  account: string
  attachments: UploadFile[]
  valueValues: { [key: string]: number | null }
  isNotReceiptValues: { [key: string]: boolean }
}

interface ItemFormProps {
  visible: boolean
  onOk: (item: Omit<NewItemWithAttachments, 'entryId'>) => void
  onCancel: () => void
  editData?: Omit<ItemWithAttachments | NewItemWithAttachments, 'entryId'>
}

export function ItemForm({ visible, onOk, onCancel, editData }: ItemFormProps) {
  const [form] = Form.useForm<ItemFormData>()
  const t = useTranslations('form.expense')
  const locale = useLocale()

  const {
    fileList,
    previewState,
    handlePreview,
    handleChange,
    handleRemove,
    beforeUpload,
    customRequest,
    handleCancel: handleModalCancel,
    closePreview,
    prepareEditState,
    saveItem
  } = useItemForm(form)

  // Load existing attachments when editing
  useEffect(() => {
    if (editData && visible) {
      prepareEditState(editData)
    } else if (!visible) {
      form.resetFields()
    }
  }, [editData, visible, prepareEditState, form])

  // Handle form submission
  const handleOk = useCallback(async () => {
    const result = await saveItem()
    if (result) {
      onOk(result)
      // Reset form after 500ms to avoid clearing it while the modal is visible
      setTimeout(() => {
        form.resetFields()
      }, 500)
    }
  }, [saveItem, onOk, form])

  // Handle modal cancel
  const handleCancel = useCallback(() => {
    onCancel()
    setTimeout(() => {
      handleModalCancel()
    }, 500)
  }, [handleModalCancel, onCancel])

  // Watch for checkbox changes to disable/enable value inputs
  const disablevalue = Form.useWatch('isNotReceiptValues', form)

  // Check if any files are uploading to disable submit button
  const hasUploadingFiles = fileList.some((file) => file.status === 'uploading')

  return (
    <>
      <Modal
        title={editData ? t('edit') : t('add')}
        open={visible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        okButtonProps={{ disabled: hasUploadingFiles }}
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

          <Form.Item
            name="attachments"
            label={t('attachments')}
            rules={[
              {
                required: true,
                message: t('attachments_error_1')
              },
              {
                validator: () => {
                  if (!Array.isArray(fileList) || fileList.length === 0) {
                    return Promise.reject(new Error(t('attachments_error_1')))
                  }

                  if (Object.values(disablevalue || {}).every(Boolean)) {
                    return Promise.reject(new Error(t('attachments_error_2')))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Space direction="vertical" className="w-full">
              <Typography.Text type="secondary" className="mb-2">
                {t('upload_note')}
              </Typography.Text>
              <Upload
                listType="picture"
                fileList={fileList}
                onPreview={handlePreview}
                onChange={handleChange}
                onRemove={handleRemove}
                accept="image/*,application/pdf"
                customRequest={customRequest}
                beforeUpload={beforeUpload}
                itemRender={(originNode, file) => (
                  <Col key={file.name} className="flex flex-col gap-2.5">
                    {originNode}
                    <Row gutter={10}>
                      <Col span={12}>
                        <Form.Item
                          name={['valueValues', file.name]}
                          rules={[
                            {
                              required: !disablevalue?.[file.name],
                              message: t('value_error_1')
                            },
                            {
                              pattern: /^(?!0+(?:[.,]0+)?$)\d+([.,]\d{1,2})?$/,
                              message: t('value_error_2')
                            }
                          ]}
                          className="mb-0"
                        >
                          <InputNumber
                            placeholder={t('value_placeholder')}
                            disabled={disablevalue?.[file.name]}
                            decimalSeparator=","
                            suffix={t('value_unit')}
                            inputMode="decimal"
                            step="0.01"
                            min={0}
                            max={1000000}
                            lang={locale}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name={['isNotReceiptValues', file.name]}
                          valuePropName="checked"
                          className="mb-0"
                        >
                          <Checkbox>{t('is_not_receipt')}</Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>
                )}
              >
                <Button icon={<PlusOutlined />}>{t('upload')}</Button>
              </Upload>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <PreviewModal previewState={previewState} closePreview={closePreview} />
    </>
  )
}
