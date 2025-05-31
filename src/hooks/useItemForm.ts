import type { FormInstance } from 'antd'
import type { RcFile } from 'antd/es/upload'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import imageCompression from 'browser-image-compression'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'

import type { ItemFormData } from '@/components/ItemForm'
import type { ItemWithAttachments, NewItemWithAttachments } from '@/lib/db/schema'
import { getMimeType, isSupportedFile } from '@/lib/file-utils'

interface PreviewState {
  open: boolean
  image: string
  title: string
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
  })

export function useItemForm(form: FormInstance<ItemFormData>) {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [previewState, setPreviewState] = useState<PreviewState>({
    open: false,
    image: '',
    title: ''
  })

  // Handle preview
  const handlePreview = useCallback(async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile)
    }
    setPreviewState({
      open: true,
      image: file.url || (file.preview as string),
      title: file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1)
    })
  }, [])

  // Handle file list change
  const handleChange = useCallback<NonNullable<UploadProps['onChange']>>(async (info) => {
    if (!isSupportedFile(info.file.type || '')) {
      return
    }

    const newFileList = [...info.fileList]

    const uniqueSet = new Set(newFileList.map((f) => f.name))

    if (uniqueSet.size !== newFileList.length) {
      return
    }

    // Convert new files to base64
    for (const file of newFileList) {
      if (file.originFileObj && !file.preview) {
        file.preview = await getBase64(file.originFileObj)
        file.status = 'done'
      }
    }

    setFileList(newFileList)
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
  const beforeUpload = useCallback(async (file: RcFile) => {
    if (!isSupportedFile(file.type)) {
      return false
    }

    if (file.size > 4 * 1024 * 1024) {
      if (file.type === 'application/pdf') {
        return false
      }
      // Compress large image files
      const options = {
        maxSizeMB: 4,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      }
      try {
        return await imageCompression(file, options)
      } catch (error) {
        console.error('Failed to compress image:', error)
        return false
      }
    }
    return true
  }, [])

  // Load existing attachments
  const prepareEditState = useCallback(
    (editData: Omit<ItemWithAttachments | NewItemWithAttachments, 'entryId'>) => {
      try {
        const files = editData.attachments.map((attachment) => {
          const mimeType = getMimeType(attachment.data)
          return {
            uid: attachment.filename,
            name: attachment.filename,
            status: 'done' as const,
            preview: attachment.data,
            type: mimeType,
            thumbUrl: attachment.data
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
      // First validate basic form fields
      await form.validateFields()
      const values = form.getFieldsValue()

      // Check if there are any attachments
      if (fileList.length === 0) {
        return null
      }

      // Check if at least one attachment has a value
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
          filename: file.name,
          data: file.preview as string,
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
    setPreviewState({ open: false, image: '', title: '' })
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
    handleCancel,
    closePreview,
    prepareEditState,
    saveItem
  }
}
