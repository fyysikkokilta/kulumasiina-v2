'use client'

import { Button, DatePicker, message, Modal, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import React, { useState } from 'react'

import { archiveEntriesAction } from '@/lib/actions/archiveEntries'
import { denyEntriesAction } from '@/lib/actions/denyEntries'
import { resetEntriesAction } from '@/lib/actions/resetEntries'
import { updateBookkeepingAccountAction } from '@/lib/actions/updateBookkeepingAccount'
import { updateItemAction } from '@/lib/actions/updateItem'
import { updateMileageAction } from '@/lib/actions/updateMileage'
import { bookkeepingAccounts } from '@/lib/bookkeeping-accounts'
import type {
  Attachment,
  Entry,
  Item,
  ItemWithAttachments,
  Mileage,
  NewItemWithAttachments,
  NewMileage
} from '@/lib/db/schema'
import { env } from '@/lib/env'
import { isImage } from '@/lib/file-utils'

import { ApproveModal } from './admin/ApproveModal'
import { DeleteOldArchivedModal } from './admin/DeleteOldArchivedModal'
import { PayModal } from './admin/PayModal'
import { ItemForm } from './ItemForm'
import { MileageForm } from './MileageForm'

type ItemWithAttachmentData = Item & {
  attachments: Omit<Attachment, 'data'>[]
}

type PopulatedEntryWithAttachmentData = Entry & {
  items: ItemWithAttachmentData[]
  mileages: Mileage[]
}

interface AdminEntryTableProps {
  entries: PopulatedEntryWithAttachmentData[]
}

type EditState = {
  entryId: number
} & (
  | {
      type: 'item'
      data: ItemWithAttachments
    }
  | {
      type: 'mileage'
      data: Mileage
    }
)

interface PreviewState {
  open: boolean
  url: string
  title: string
  isImage: boolean
  isNotReceipt: boolean
  value: number | null
}

export function AdminEntryTable({ entries }: AdminEntryTableProps) {
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
    }
  }

  const columns: ColumnsType<PopulatedEntryWithAttachmentData> = [
    {
      title: t('table.id'),
      dataIndex: 'id',
      key: 'id',
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend'
    },
    {
      title: t('table.date'),
      dataIndex: 'submissionDate',
      key: 'submissionDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.submissionDate).getTime() - new Date(b.submissionDate).getTime(),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div className="p-2">
          <DatePicker.RangePicker
            value={
              selectedKeys[0]
                ? [dayjs(selectedKeys[0] as string), dayjs(selectedKeys[1] as string)]
                : null
            }
            onChange={(dates) => {
              if (dates) {
                setSelectedKeys([dates[0]?.toISOString() || '', dates[1]?.toISOString() || ''])
              } else {
                setSelectedKeys([])
              }
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button size="small" onClick={() => confirm()}>
              {t('filter.filter')}
            </Button>
            <Button size="small" onClick={() => clearFilters?.()}>
              {t('filter.reset')}
            </Button>
          </div>
        </div>
      ),
      onFilter: (value, record) => {
        const date = new Date(record.submissionDate)
        const dates = value as unknown as [string, string]
        return date >= new Date(dates[0]) && date <= new Date(dates[1])
      }
    },
    {
      title: t('table.name'),
      dataIndex: 'name',
      key: 'name',
      filterSearch: true,
      filters: [...new Set(entries.map((entry) => entry.name))].map((name) => ({
        text: name,
        value: name
      })),
      onFilter: (value, record) => record.name === value
    },
    {
      title: t('table.title'),
      dataIndex: 'title',
      key: 'title'
    },
    {
      title: t('table.total'),
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `${total.toFixed(2)} €`
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
      filters: [
        { text: t('filter.submitted'), value: 'submitted' },
        { text: t('filter.approved'), value: 'approved' },
        { text: t('filter.paid'), value: 'paid' },
        { text: t('filter.denied'), value: 'denied' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: t('table.archived'),
      dataIndex: 'archived',
      key: 'archived',
      render: (archived: boolean) => (
        <Tag color={archived ? 'gray' : 'green'}>
          {archived ? t('status.archived') : t('status.active')}
        </Tag>
      ),
      filters: [
        { text: t('status.archived'), value: true },
        { text: t('status.active'), value: false }
      ],
      onFilter: (value, record) => record.archived === value,
      defaultFilteredValue: [false]
    },
    {
      title: t('table.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => window.open(`/api/entry/${record.id}/pdf`)}>
            {t('actions.pdf')}
          </Button>
          {(record.status === 'paid' || record.status === 'approved') && (
            <Button size="small" onClick={() => window.open(`/api/entry/${record.id}/csv`)}>
              {record.status === 'paid' ? t('actions.zip') : t('actions.csv')}
            </Button>
          )}
        </Space>
      )
    }
  ]

  const expandedRowRender = (record: PopulatedEntryWithAttachmentData) => {
    return (
      <div className="bg-gray-50 p-4">
        <div className="mb-4">
          <Typography.Text strong>{t('table.contact')}: </Typography.Text>
          <Typography.Text>{record.contact}</Typography.Text>
        </div>

        <div className="mb-4">
          <Typography.Text strong>{t('table.iban')}: </Typography.Text>
          <Typography.Text>{record.iban}</Typography.Text>
        </div>

        {record.items.length > 0 && (
          <div className="mb-4">
            <Typography.Text strong>{t('table.items')}:</Typography.Text>
            {record.items.map((item) => (
              <div key={item.id} className="mt-2 ml-4 rounded bg-white p-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Typography.Text className="text-gray-600">
                      {dayjs(item.date).format('DD.MM.YYYY')} -{' '}
                      {item.attachments
                        .reduce((acc, att) => {
                          if (att.isNotReceipt) {
                            return acc
                          }
                          return acc + (att.value || 0)
                        }, 0)
                        .toFixed(2)}{' '}
                      €
                    </Typography.Text>
                    <div className="flex items-center gap-2">
                      <Select
                        size="small"
                        value={item.account || undefined}
                        placeholder={t('table.select_account')}
                        style={{ minWidth: 200 }}
                        showSearch
                        disabled={!!record.archived}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={bookkeepingAccounts.map((account) => ({
                          value: account.value,
                          label: account.label
                        }))}
                        onChange={(value) => handleAccountUpdate(item.id, value, false)}
                      />
                      <Button
                        size="small"
                        onClick={() => handleEditItem(item, record.id)}
                        disabled={!!record.archived}
                      >
                        {t('actions.edit')}
                      </Button>
                    </div>
                  </div>
                  <Typography.Text className="text-sm text-gray-600">
                    {t('table.description')}: {item.description}
                  </Typography.Text>
                  {item.attachments.length > 0 && (
                    <div className="mt-2">
                      <Typography.Text className="text-sm text-gray-600">
                        {t('table.attachments')}:
                      </Typography.Text>
                      <div className="mt-1 flex flex-col gap-1">
                        {item.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-2">
                            <Button
                              type="link"
                              size="small"
                              className="h-auto p-0 text-blue-600 hover:text-blue-800"
                              onClick={() =>
                                handlePreviewAttachment(
                                  attachment.id,
                                  attachment.filename,
                                  attachment.isNotReceipt,
                                  attachment.value
                                )
                              }
                            >
                              {attachment.filename}
                            </Button>
                            {attachment.isNotReceipt ? (
                              <Tag color="orange">{t('table.not_receipt')}</Tag>
                            ) : attachment.value ? (
                              <Tag color="blue">{attachment.value.toFixed(2)} €</Tag>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {record.mileages.length > 0 && (
          <div className="mb-4">
            <Typography.Text strong>{t('table.mileages')}:</Typography.Text>
            {record.mileages.map((mileage) => (
              <div key={mileage.id} className="mt-2 ml-4 rounded bg-white p-2">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Typography.Text className="text-gray-600">
                      {dayjs(mileage.date).format('DD.MM.YYYY')} - {mileage.distance} km -{' '}
                      {(mileage.distance * env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE).toFixed(2)} €
                    </Typography.Text>
                    <div className="flex items-center gap-2">
                      <Select
                        size="small"
                        value={mileage.account || undefined}
                        placeholder={t('table.select_account')}
                        style={{ minWidth: 200 }}
                        showSearch
                        disabled={!!record.archived}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={bookkeepingAccounts.map((account) => ({
                          value: account.value,
                          label: account.label
                        }))}
                        onChange={(value) => handleAccountUpdate(mileage.id, value, true)}
                      />
                      <Button
                        size="small"
                        onClick={() => handleEditMileage(mileage, record.id)}
                        disabled={!!record.archived}
                      >
                        {t('actions.edit')}
                      </Button>
                    </div>
                  </div>
                  <Typography.Text className="text-sm text-gray-600">
                    {t('table.description')}: {mileage.description}
                  </Typography.Text>
                  <Typography.Text className="text-sm text-gray-600">
                    {t('table.route')}: {mileage.route}
                  </Typography.Text>
                  <Typography.Text className="text-sm text-gray-600">
                    {t('table.plate_number')}: {mileage.plateNo}
                  </Typography.Text>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Space>
            {record.status === 'submitted' && (
              <>
                <Button onClick={() => handleApprove([record.id])}>{t('actions.approve')}</Button>
                <Button onClick={() => handleDeny([record.id])}>{t('actions.deny')}</Button>
              </>
            )}
            {record.status === 'approved' && (
              <Button onClick={() => handlePay([record.id])}>{t('actions.pay')}</Button>
            )}
            {record.status !== 'submitted' && !record.archived && (
              <Button onClick={() => handleReset([record.id])}>{t('actions.reset')}</Button>
            )}
            {(record.status === 'paid' || record.status === 'denied') && !record.archived && (
              <Button danger onClick={() => handleArchive([record.id])}>
                {t('actions.archive')}
              </Button>
            )}
          </Space>
        </div>
      </div>
    )
  }

  const handleEditItem = async (item: ItemWithAttachmentData, entryId: number) => {
    // Fetch the attachments data since we don't have it loaded
    const attachments = await Promise.all(
      item.attachments.map(async (attachment) => ({
        ...attachment,
        data: await fetch(`/api/attachment/${attachment.id}`, {
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
    attachmentId: number,
    filename: string,
    isNotReceipt: boolean,
    value: number | null
  ) => {
    const attachment = await fetch(`/api/attachment/${attachmentId}`, {
      next: {
        revalidate: 60 * 60 * 24 // 24 hours
      }
    }).then((res) => res.text())
    setPreviewState({
      open: true,
      url: attachment,
      title: filename,
      isImage: isImage(attachment),
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

  return (
    <div className="space-y-4">
      {selectedRowKeys.length > 0 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
          <Typography.Text>
            <strong>{selectedRowKeys.length}</strong> {t('selection.entries_selected')}
            {selectedStatus && (
              <span className="ml-2">
                ({t('selection.status')}:{' '}
                <Tag color={getStatusColor(selectedStatus)}>{t(`status.${selectedStatus}`)}</Tag>)
              </span>
            )}
            {!allSelectedSameStatus && (
              <span className="ml-2 text-orange-600">({t('selection.mixed_statuses')})</span>
            )}
          </Typography.Text>
        </div>
      )}

      <div className="flex items-center justify-end">
        <Space>
          {allSelectedSubmitted && noneArchived && (
            <Button
              type="primary"
              onClick={() => handleApprove()}
              disabled={selectedRowKeys.length === 0}
            >
              {t('bulk_actions.approve_selected')} ({selectedRowKeys.length})
            </Button>
          )}
          {allSelectedSubmitted && noneArchived && (
            <Button onClick={() => handleDeny()} disabled={selectedRowKeys.length === 0}>
              {t('bulk_actions.deny_selected')} ({selectedRowKeys.length})
            </Button>
          )}
          {allSelectedApproved && noneArchived && (
            <Button onClick={() => handlePay()} disabled={selectedRowKeys.length === 0}>
              {t('bulk_actions.mark_as_paid')} ({selectedRowKeys.length})
            </Button>
          )}
          {(allSelectedApproved || allSelectedDenied || allSelectedPaid) && noneArchived && (
            <Button onClick={() => handleReset()} disabled={selectedRowKeys.length === 0}>
              {t('bulk_actions.reset_selected')} ({selectedRowKeys.length})
            </Button>
          )}
          {(allSelectedDenied || allSelectedPaid) && noneArchived && (
            <Button danger onClick={() => handleArchive()} disabled={selectedRowKeys.length === 0}>
              {t('bulk_actions.archive_selected')} ({selectedRowKeys.length})
            </Button>
          )}
          {allSelectedPaid && (
            <Button
              onClick={handleMultiZipDownload}
              disabled={selectedRowKeys.length === 0}
              type="default"
            >
              {t('bulk_actions.download_zip')} ({selectedRowKeys.length})
            </Button>
          )}
          {toBeDeleted > 0 && (
            <Button danger onClick={() => setDeleteOldArchivedModalVisible(true)}>
              {t('bulk_actions.remove_old_archived')} ({toBeDeleted})
            </Button>
          )}
        </Space>
      </div>

      <Table
        rowSelection={rowSelection}
        columns={columns}
        dataSource={tableData}
        expandable={{
          expandedRowRender
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true
        }}
      />

      {/* Modals */}
      <ApproveModal
        visible={approveModalVisible}
        onCancel={() => setApproveModalVisible(false)}
        entryIds={modalEntryIds}
        onSuccess={() => {
          setApproveModalVisible(false)
          setSelectedRowKeys([])
        }}
      />

      <PayModal
        visible={payModalVisible}
        onCancel={() => setPayModalVisible(false)}
        entryIds={modalEntryIds}
        onSuccess={() => {
          setPayModalVisible(false)
          setSelectedRowKeys([])
        }}
      />

      <DeleteOldArchivedModal
        visible={deleteOldArchivedModalVisible}
        onCancel={() => setDeleteOldArchivedModalVisible(false)}
        onSuccess={() => {
          setDeleteOldArchivedModalVisible(false)
          setSelectedRowKeys([])
        }}
      />

      {editState?.type === 'item' && editState.data && (
        <ItemForm
          visible={true}
          onOk={handleItemUpdate}
          onCancel={() => setEditState(null)}
          editData={editState.data}
        />
      )}

      {editState?.type === 'mileage' && editState.data && (
        <MileageForm
          visible={true}
          onOk={handleMileageUpdate}
          onCancel={() => setEditState(null)}
          editData={editState.data}
        />
      )}

      {/* Preview Modal */}
      <Modal
        open={previewState.open}
        title={`${previewState.title} ${previewState.isNotReceipt ? `(${t('table.not_receipt')})` : `(${previewState.value?.toFixed(2)}€)`}`}
        footer={null}
        onCancel={closePreview}
        width="80%"
        style={{ maxWidth: '1200px' }}
      >
        {previewState.isImage ? (
          <div className="relative h-[80vh] w-full">
            <Image
              alt="preview"
              src={previewState.url}
              className="h-full w-full max-w-[1200px] object-contain"
              fill
            />
          </div>
        ) : (
          <iframe
            src={previewState.url}
            style={{ width: '100%', height: '70vh', border: 'none' }}
            title={previewState.title}
          />
        )}
      </Modal>
    </div>
  )
}
