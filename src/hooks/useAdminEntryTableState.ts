import { message } from 'antd'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import { useState } from 'react'

import {
  ItemWithoutAttachmentData,
  PopulatedEntryWithAttachmentData
} from '@/components/admin/admin-types'
import { EditState, PreviewState } from '@/components/admin/admin-types'
import { archiveEntriesAction } from '@/lib/actions/archiveEntries'
import { denyEntriesAction } from '@/lib/actions/denyEntries'
import { resetEntriesAction } from '@/lib/actions/resetEntries'
import { updateBookkeepingAccountAction } from '@/lib/actions/updateBookkeepingAccount'
import { updateItemAction } from '@/lib/actions/updateItem'
import { updateMileageAction } from '@/lib/actions/updateMileage'
import { bookkeepingAccounts } from '@/lib/bookkeeping-accounts'
import type { Mileage, NewItemWithAttachments, NewMileage } from '@/lib/db/schema'
import { env } from '@/lib/env'

export function useAdminEntryTableState(entries: PopulatedEntryWithAttachmentData[]) {
  const t = useTranslations('admin')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [deleteOldArchivedModalVisible, setDeleteOldArchivedModalVisible] = useState(false)
  const [modalEntryIds, setModalEntryIds] = useState<number[]>([])
  const [editState, setEditState] = useState<EditState | null>(null)
  const [previewState, setPreviewState] = useState<PreviewState>({
    open: false,
    url: '',
    title: '',
    isImage: false,
    isNotReceipt: false,
    value: null
  })

  const { execute: denyEntries } = useAction(denyEntriesAction, {
    onSuccess: () => {
      message.success(t('messages.entries_denied'))
      setSelectedRowKeys([])
    },
    onError: () => {
      message.error(t('messages.deny_failed'))
    }
  })

  const { execute: archiveEntries } = useAction(archiveEntriesAction, {
    onSuccess: () => {
      message.success(t('messages.entries_archived'))
      setSelectedRowKeys([])
    },
    onError: () => {
      message.error(t('messages.archive_failed'))
    }
  })

  const { execute: resetEntries } = useAction(resetEntriesAction, {
    onSuccess: () => {
      message.success(t('messages.entries_reset'))
      setSelectedRowKeys([])
    },
    onError: () => {
      message.error(t('messages.reset_failed'))
    }
  })

  const { execute: updateItem } = useAction(updateItemAction, {
    onSuccess: () => {
      message.success(t('messages.item_updated'))
      setEditState(null)
    },
    onError: () => {
      message.error(t('messages.update_failed'))
    }
  })

  const { execute: updateMileage } = useAction(updateMileageAction, {
    onSuccess: () => {
      message.success(t('messages.mileage_updated'))
      setEditState(null)
    },
    onError: () => {
      message.error(t('messages.update_failed'))
    }
  })

  const { execute: updateBookkeepingAccount } = useAction(updateBookkeepingAccountAction, {
    onSuccess: () => {
      message.success(t('messages.account_updated'))
    },
    onError: () => {
      message.error(t('messages.update_failed'))
    }
  })

  // Calculate total for each entry
  const tableData = entries.map((entry) => {
    const itemTotal = entry.items.reduce((acc, item) => {
      return (
        acc +
        item.attachments.reduce((attachAcc, attachment) => {
          if (attachment.isNotReceipt) {
            return attachAcc
          }
          return attachAcc + (attachment.value || 0)
        }, 0)
      )
    }, 0)

    const mileageTotal = entry.mileages.reduce((acc, mileage) => {
      return acc + mileage.distance * env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE
    }, 0)

    return {
      ...entry,
      key: entry.id,
      total: itemTotal + mileageTotal
    }
  })

  // Calculate entries to be deleted
  const toBeDeleted = entries
    .filter((entry) => entry.archived)
    .filter((entry) => {
      const date =
        entry.status === 'paid'
          ? entry.paidDate && dayjs(entry.paidDate)
          : entry.rejectionDate && dayjs(entry.rejectionDate)
      const monthAgo = dayjs().subtract(env.NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS, 'days')
      return date && date.isBefore(monthAgo)
    }).length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'blue'
      case 'approved':
        return 'green'
      case 'paid':
        return 'purple'
      case 'denied':
        return 'red'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return t('status.submitted')
      case 'approved':
        return t('status.approved')
      case 'paid':
        return t('status.paid')
      case 'denied':
        return t('status.denied')
      default:
        return ''
    }
  }

  const handleEditItem = async (item: ItemWithoutAttachmentData, entryId: number) => {
    // Fetch the attachments data since we don't have it loaded
    const attachments = await Promise.all(
      item.attachments.map(async (attachment) => ({
        ...attachment,
        data: await fetch(`/api/attachment/${attachment.fileId}`, {
          next: {
            revalidate: 60 * 60 * 24 // 24 hours
          }
        }).then((res) => res.text())
      }))
    )
    setEditState({
      type: 'item',
      data: {
        ...item,
        attachments
      },
      entryId
    })
  }

  const handleEditMileage = (mileage: Mileage, entryId: number) => {
    setEditState({
      type: 'mileage',
      data: mileage,
      entryId
    })
  }

  const handleItemUpdate = (itemData: Omit<NewItemWithAttachments, 'entryId'>) => {
    if (editState?.data) {
      updateItem({
        id: editState.data.id,
        description: itemData.description,
        date: itemData.date,
        account: itemData.account || '',
        attachments: itemData.attachments.map((attachment) => ({
          ...attachment,
          isNotReceipt: attachment.isNotReceipt || false,
          value: attachment.value || null
        }))
      })
    }
  }

  const handleMileageUpdate = (mileageData: Omit<NewMileage, 'entryId'>) => {
    if (editState?.data) {
      updateMileage({
        id: editState.data.id,
        description: mileageData.description,
        date: mileageData.date,
        route: mileageData.route,
        distance: mileageData.distance,
        plateNo: mileageData.plateNo,
        account: mileageData.account || ''
      })
    }
  }

  const handleAccountUpdate = (id: number, account: string, isMileage: boolean) => {
    updateBookkeepingAccount({
      id,
      account,
      isMileage
    })
  }

  const handlePreviewAttachment = async (
    fileId: string,
    filename: string,
    isNotReceipt: boolean,
    value: number | null
  ) => {
    const res = await fetch(`/api/attachment/${fileId}`, {
      next: {
        revalidate: 60 * 60 * 24 // 24 hours
      }
    })
    const attachment = await res.blob()
    const mimeType = res.headers.get('content-type')
    const url = URL.createObjectURL(attachment)
    setPreviewState({
      open: true,
      url,
      title: filename,
      isImage: mimeType?.startsWith('image/') ?? false,
      isNotReceipt,
      value
    })
  }

  const closePreview = () => {
    setPreviewState({
      open: false,
      url: '',
      title: '',
      isImage: false,
      isNotReceipt: false,
      value: 0
    })
  }

  const handleApprove = (ids?: number[]) => {
    const targetIds = ids || selectedRowKeys.map((key) => Number(key))
    setModalEntryIds(targetIds)
    setApproveModalVisible(true)
  }

  const handleDeny = (ids?: number[]) => {
    const targetIds = ids || selectedRowKeys.map((key) => Number(key))
    denyEntries({ ids: targetIds })
  }

  const handlePay = (ids?: number[]) => {
    const targetIds = ids || selectedRowKeys.map((key) => Number(key))
    setModalEntryIds(targetIds)
    setPayModalVisible(true)
  }

  const handleArchive = (ids?: number[]) => {
    const targetIds = ids || selectedRowKeys.map((key) => Number(key))
    archiveEntries({ ids: targetIds })
  }

  const handleReset = (ids?: number[]) => {
    const targetIds = ids || selectedRowKeys.map((key) => Number(key))
    resetEntries({ ids: targetIds })
  }

  const handleMultiZipDownload = () => {
    const ids = selectedRowKeys.map((key) => Number(key))
    const url = `/api/entry/multi/csv?entry_ids=${ids.join(',')}`
    window.open(url)
  }

  const handleCopyClipboardText = () => {
    const clipboardText = tableData
      .filter((entry) => selectedRowKeys.includes(entry.id))
      .map((entry) => {
        const accounts = entry.items
          .map((item) => item.account)
          .concat(entry.mileages.map((mileage) => mileage.account))
        const uniqueAccounts = accounts
          .filter((value, index, self) => self.indexOf(value) === index && value)
          .map((account) => bookkeepingAccounts.find((a) => a.value === account)?.label)
          .sort()
          .join(', ')
        if (entry.mileages.length > 0) {
          const totalDistance = entry.mileages.reduce((acc, mileage) => acc + mileage.distance, 0)
          return `${entry.name}, ${
            entry.title
          } (${totalDistance} km); ${entry.total.toFixed(2)} € (${uniqueAccounts})`
        }
        return `${entry.name}, ${entry.title}; ${entry.total.toFixed(2)} € (${uniqueAccounts})`
      })
      .join('\n')
    void navigator.clipboard.writeText(clipboardText)
  }

  // Get the status of selected entries to determine which actions are available
  const selectedEntries = tableData.filter((entry) => selectedRowKeys.includes(entry.key))
  const selectedStatuses = [...new Set(selectedEntries.map((entry) => entry.status))]
  const allSelectedSameStatus = selectedStatuses.length === 1
  const selectedStatus = allSelectedSameStatus ? selectedStatuses[0] : null
  const allSelectedPaid = selectedStatus === 'paid'
  const allSelectedSubmitted = selectedStatus === 'submitted'
  const allSelectedApproved = selectedStatus === 'approved'
  const allSelectedDenied = selectedStatus === 'denied'
  const noneArchived = selectedEntries.every((entry) => !entry.archived)

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record: PopulatedEntryWithAttachmentData) => ({
      // Disable selection if we already have selections of a different status
      disabled: selectedRowKeys.length > 0 && !selectedStatuses.includes(record.status)
    })
  }

  return {
    t,
    tableData,
    toBeDeleted,
    getStatusColor,
    getStatusText,
    rowSelection,
    approveModalVisible,
    setApproveModalVisible,
    payModalVisible,
    setPayModalVisible,
    deleteOldArchivedModalVisible,
    setDeleteOldArchivedModalVisible,
    modalEntryIds,
    setSelectedRowKeys,
    editState,
    setEditState,
    handleItemUpdate,
    handleMileageUpdate,
    previewState,
    closePreview,
    handleEditItem,
    handleEditMileage,
    handleAccountUpdate,
    handlePreviewAttachment,
    handleApprove,
    handleDeny,
    handlePay,
    handleArchive,
    handleReset,
    handleMultiZipDownload,
    handleCopyClipboardText,
    allSelectedPaid,
    allSelectedSubmitted,
    allSelectedApproved,
    allSelectedDenied,
    noneArchived,
    selectedRowKeys,
    selectedStatus,
    allSelectedSameStatus
  }
}
