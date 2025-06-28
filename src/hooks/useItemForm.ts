import type { FormInstance } from 'antd'
import { message, Upload } from 'antd'
import type { RcFile } from 'antd/es/upload'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import dayjs from 'dayjs'
import type { UploadRequestOption } from 'rc-upload/lib/interface'
import { useCallback, useState } from 'react'

import type { ItemFormData } from '@/components/ItemForm'
import type { PreviewState } from '@/components/PreviewModal'
import type { ItemWithAttachments, NewItemWithAttachments } from '@/lib/db/schema'

export function useItemForm(form: FormInstance<ItemFormData>) {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewState, setPreviewState] = useState<PreviewState>({
    open: false,
    url: '',
    title: '',
    isImage: false,
    isNotReceipt: false,
    value: null
  })

  // Custom upload handler for Ant Design Upload
  const customRequest = async (options: UploadRequestOption) => {
    const { file, filename, onSuccess, onError } = options
    const formData = new FormData()
    formData.append('file', file)
    formData.append('filename', filename || '')
    try {
      const res = await fetch('/api/attachment', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) throw new Error('Upload failed')
      const data = (await res.json()) as { fileId: string; filename: string }
      if (onSuccess) {
        onSuccess({ fileId: data.fileId, filename: data.filename }, file)
      }
    } catch (err) {
      message.error('File upload failed')
      if (onError) {
        onError(err as Error)
      }
    }
  }

  // Handle preview
  const handlePreview = useCallback(
    async (file: UploadFile) => {
      if (!file.url && !file.preview) {
        // For preview, use the download API
        file.url = `/api/attachment/${file.uid}`
      }
      const res = await fetch(`/api/attachment/${file.uid}`, {
        next: {
          revalidate: 60 * 60 * 24 // 24 hours
        }
      })
      const attachment = await res.blob()
      const mimeType = res.headers.get('content-type')
      const url = URL.createObjectURL(attachment)
      const isNotReceipts = form.getFieldValue('isNotReceiptValues') as
        | { [key: string]: boolean }
        | undefined
      const values = form.getFieldValue('valueValues') as
        | { [key: string]: number | null }
        | undefined
      const isNotReceipt = isNotReceipts?.[file.name] ?? false
      const value = values?.[file.name] ?? null
      setPreviewState({
        open: true,
        url,
        title: file.name,
        isImage: mimeType?.startsWith('image/') ?? false,
        isNotReceipt,
        value
      })
    },
    [form]
  )

  // Handle file list change
  const handleChange = useCallback<NonNullable<UploadProps['onChange']>>((info) => {
    // Patch fileList to store fileId in uid and for preview/download
    const patchedList = info.fileList.map((file) => {
      const response = file.response as { fileId?: string } | undefined
      if (response?.fileId) {
        return {
          ...file,
          uid: response.fileId,
          url: `/api/attachment/${response.fileId}`
        }
      }
      return file
    })
    setFileList(patchedList)
  }, [])

  // Handle file removal
  const handleRemove = useCallback(
    (file: UploadFile) => {
      // Remove from fileList
      const newFileList = fileList.filter((f) => f.name !== file.name)
      setFileList(newFileList)

      // Clean up form fields for this attachment
      const currentValues = form.getFieldsValue()
      const newvalue = { ...currentValues.valueValues }
      const newIsNotReceipts = { ...currentValues.isNotReceiptValues }

      delete newvalue[file.name]
      delete newIsNotReceipts[file.name]

      form.setFieldsValue({
        valueValues: newvalue,
        isNotReceiptValues: newIsNotReceipts
      })
    },
    [fileList, form]
  )

  // Before upload handler
  const beforeUpload = useCallback((file: RcFile) => {
    if (file.size > 8 * 1024 * 1024) {
      return Upload.LIST_IGNORE
    }
    return true
  }, [])

  // Load existing attachments
  const prepareEditState = useCallback(
    (editData: Omit<ItemWithAttachments | NewItemWithAttachments, 'entryId'>) => {
      try {
        const files = editData.attachments.map((attachment) => {
          const id = attachment.fileId
          const ext = attachment.filename.split('.').pop()
          return {
            uid: id,
            name: attachment.filename,
            status: 'done' as const,
            url: `/api/attachment/${id}`,
            type: ext === 'pdf' ? 'application/pdf' : 'image/webp',
            thumbUrl: undefined
          }
        })

        setFileList(files)

        // Set form values
        const value: { [key: string]: number | null } = {}
        const isNotReceiptValues: { [key: string]: boolean } = {}

        editData.attachments.forEach((attachment) => {
          value[attachment.filename] = attachment.value ?? null
          isNotReceiptValues[attachment.filename] = attachment.isNotReceipt ?? false
        })

        form.setFieldsValue({
          attachments: files,
          description: editData.description,
          date: dayjs(editData.date),
          account: editData.account || undefined,
          valueValues: value,
          isNotReceiptValues: isNotReceiptValues
        })
      } catch (error) {
        console.error('Failed to load attachments:', error)
      }
    },
    [form]
  )

  // Save item
  const saveItem = useCallback(async () => {
    try {
      await form.validateFields()
      const values = form.getFieldsValue()
      if (fileList.length === 0) {
        return null
      }
      const hasAtLeastOneValue = fileList.some((file) => {
        const isNotReceipt = values.isNotReceiptValues?.[file.name]
        const hasValue = values.valueValues?.[file.name]
        return !isNotReceipt && hasValue
      })
      if (!hasAtLeastOneValue) {
        return null
      }
      const attachments = fileList.map((file) => {
        const shouldHaveValue = !values.isNotReceiptValues?.[file.name]
        return {
          fileId: file.uid, // random filename for storage
          filename: file.name, // original filename for display
          value: shouldHaveValue ? values.valueValues?.[file.name] : null,
          isNotReceipt: values.isNotReceiptValues?.[file.name] || false
        }
      })
      const itemData = {
        description: values.description,
        date: values.date.toDate(),
        account: values.account || null,
        attachments
      }
      return itemData
    } catch (error) {
      console.error('Form validation failed:', error)
      return null
    }
  }, [form, fileList])

  // Reset form
  const handleCancel = useCallback(() => {
    form.resetFields()
    setFileList([])
    setPreviewState({
      open: false,
      url: '',
      title: '',
      isImage: false,
      isNotReceipt: false,
      value: null
    })
  }, [form])

  // Close preview
  const closePreview = useCallback(() => {
    setPreviewState((prev) => ({ ...prev, open: false }))
  }, [])

  return {
    fileList,
    previewState,
    handlePreview,
    handleChange,
    handleRemove,
    beforeUpload,
    customRequest,
    handleCancel,
    closePreview,
    prepareEditState,
    saveItem
  }
}
