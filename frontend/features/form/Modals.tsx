import React, { useState } from 'react'
import {
  Modal,
  Form,
  FormInstance,
  Input,
  DatePicker,
  Upload,
  message as AntdMessage,
  Checkbox,
  Row,
  Col,
  Button,
} from 'antd'
import type { RcFile, UploadProps } from 'antd/es/upload'
import type { UploadFile, UploadChangeParam } from 'antd/es/upload/interface'
import { Dayjs } from 'dayjs'
import type { UploadRequestOption } from 'rc-upload/lib/interface'
import imageCompression from 'browser-image-compression'
import { api } from '../utils'
import { useTranslation } from 'react-i18next'

type ModalProps = {
  visible: boolean
  onOk: () => void
  onCancel: () => void
}

export type MileageFormValues = {
  description: string
  date: Dayjs
  route: string
  distance: string
  plate_no: string
}

export type ExpenseFormValues = {
  description: string
  date: Dayjs
  attachments: UploadChangeParam
  value_cents: {
    [key: string]: string
  }
  is_not_receipts: {
    [key: string]: boolean
  }
}

type MileageModalProps = ModalProps & {
  form: FormInstance<MileageFormValues>
}

type ExpenseModalProps = ModalProps & {
  form: FormInstance<ExpenseFormValues>
  fileList: UploadFile[]
  setFileList: (fileList: UploadFile[]) => void
}

export const MileageModal: React.FC<MileageModalProps> = (props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'form.mileage' })
  return (
    <Modal
      title={t('add')}
      open={props.visible}
      onOk={props.onOk}
      onCancel={props.onCancel}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        layout="horizontal"
        form={props.form}
        requiredMark={false}
      >
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
          rules={[
            {
              required: true,
              message: t('date_error'),
            },
          ]}
        >
          <DatePicker format="YYYY-MM-DD" picker="date" />
        </Form.Item>
        <Form.Item
          name="route"
          label={t('route')}
          rules={[{ required: true, message: t('route_error') }]}
        >
          <Input.TextArea
            showCount
            maxLength={500}
            rows={2}
            placeholder={t('route_placeholder')}
          />
        </Form.Item>
        <Form.Item
          name="distance"
          label={t('distance')}
          rules={[
            {
              required: true,
              message: t('distance_error_1'),
            },
            {
              pattern: /^\d+([.,]\d{1,2})?$/,
              message: t('distance_error_2'),
            },
          ]}
        >
          <Input
            suffix={t('distance_unit')}
            placeholder={t('distance_placeholder')}
          />
        </Form.Item>
        <Form.Item
          name="plate_no"
          label={t('plate_number')}
          rules={[
            {
              required: true,
              message: t('plate_number_error'),
            },
          ]}
        >
          <Input placeholder={t('plate_number_placeholder')} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

export const ItemModal = (props: ExpenseModalProps) => {
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const { i18n, t } = useTranslation('translation', {
    keyPrefix: 'form.expense',
  })

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile)
    }

    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
    setPreviewTitle(file.name)
  }

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) =>
    props.setFileList(newFileList)

  const handleRemove: UploadProps['onRemove'] = ({
    response: attachment_id,
  }) => {
    if (attachment_id) {
      api.delete(`/attachment/${attachment_id}`)
    }
  }

  const resetUpload = () => {
    setPreviewOpen(false)
    setPreviewImage('')
    setPreviewTitle('')
  }

  const beforeUpload = (file: RcFile) => {
    // check pdf size is under 4MB
    if (file.size > 4 * 1024 * 1024) {
      if (file.type === 'application/pdf') {
        AntdMessage.error(t('upload_error'), 5)
        return Upload.LIST_IGNORE
      }
      // compress too large image files
      const options = {
        maxSizeMB: 4,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      }
      return imageCompression(file, options)
    }
    return true
  }
  const upload = (options: UploadRequestOption) => {
    const { onSuccess, onError, file, action } = options
    console.log(options)
    const formData = new FormData()
    formData.append('file', file)
    api
      .post(action, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        if (onSuccess) {
          console.log(response.data)
          onSuccess(response.data)
        }
      })
      .catch((err) => {
        if (onError) {
          onError(err)
        }
      })
  }

  console.log('FILE LIST:', props.fileList)
  console.log('FORM VALUES:', props.form.getFieldsValue())

  const disableValueCents = Form.useWatch('is_not_receipts', props.form)

  return (
    <Modal
      title={t('add')}
      open={props.visible}
      onOk={() => {
        props.onOk()
        resetUpload()
      }}
      onCancel={() => {
        props.onCancel()
        resetUpload()
      }}
    >
      <Form
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
        layout="horizontal"
        form={props.form}
        requiredMark={false}
      >
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
          rules={[
            {
              required: true,
              message: t('date_error'),
            },
          ]}
        >
          <DatePicker format="YYYY-MM-DD" picker="date" />
        </Form.Item>
        <Form.Item
          name="attachments"
          label={t('attachments')}
          rules={[
            {
              required: true,
              message: t('attachments_error_1'),
            },
            {
              validator: (_, value) => {
                const fileList = value.fileList as UploadFile[]
                if (!Array.isArray(fileList) || fileList.length === 0) {
                  return Promise.reject(t('attachments_error_1'))
                }

                if (Object.values(disableValueCents).every(Boolean)) {
                  return Promise.reject(t('attachments_error_2'))
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <Upload
            action="/attachment"
            listType="picture"
            fileList={props.fileList}
            onPreview={handlePreview}
            onChange={handleChange}
            onRemove={handleRemove}
            accept="image/*,.pdf"
            beforeUpload={beforeUpload}
            customRequest={upload}
            itemRender={(originNode, file) => (
              <Col
                key={String(file.response)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {originNode}
                <Row style={{ gap: '10px' }}>
                  <Form.Item
                    name={['value_cents', String(file.response)]}
                    rules={[
                      {
                        required: !disableValueCents?.[String(file.response)],
                        message: t('value_cents_error_1'),
                      },
                      {
                        pattern: /^\d+([.,]\d{1,2})?$/,
                        message: t('value_cents_error_2'),
                      },
                    ]}
                    style={{ width: '50%', marginBottom: 0 }}
                  >
                    <Input
                      placeholder={t('value_cents_placeholder')}
                      disabled={disableValueCents?.[String(file.response)]}
                      suffix={t('value_cents_unit')}
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      lang={i18n.language}
                    />
                  </Form.Item>
                  <Form.Item
                    name={['is_not_receipts', String(file.response)]}
                    valuePropName="checked"
                  >
                    <Checkbox>{t('is_not_receipt')}</Checkbox>
                  </Form.Item>
                </Row>
              </Col>
            )}
          >
            <Button>{t('upload')}</Button>
          </Upload>
        </Form.Item>
        <Modal
          open={previewOpen}
          title={previewTitle}
          footer={null}
          onCancel={() => setPreviewOpen(false)}
          width="80%"
        >
          <img alt="example" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      </Form>
    </Modal>
  )
}
