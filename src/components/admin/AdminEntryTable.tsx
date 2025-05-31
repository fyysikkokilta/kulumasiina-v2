'use client'

import { Button, Space, Table, Tag, Typography } from 'antd'
import { useTranslations } from 'next-intl'
import React from 'react'

import { useAdminEntryTableState } from '../../hooks/useAdminEntryTableState'
import type { PopulatedEntryWithAttachmentData } from './admin-types'
import { AdminEntryExpandedRow } from './AdminEntryExpandedRow'
import { AdminEntryModals } from './AdminEntryModals'
import { getAdminEntryTableColumns } from './AdminEntryTableColumns'

interface AdminEntryTableProps {
  entries: PopulatedEntryWithAttachmentData[]
}

export function AdminEntryTable({ entries }: AdminEntryTableProps) {
  const {
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
    allSelectedPaid,
    allSelectedSubmitted,
    allSelectedApproved,
    allSelectedDenied,
    noneArchived,
    selectedRowKeys,
    selectedStatus,
    allSelectedSameStatus
  } = useAdminEntryTableState(entries)

  const columns = getAdminEntryTableColumns(t, getStatusColor, getStatusText, entries)

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
          expandedRowRender: (record: PopulatedEntryWithAttachmentData) => (
            <AdminEntryExpandedRow
              record={record}
              handleAccountUpdate={handleAccountUpdate}
              handleEditItem={handleEditItem}
              handleEditMileage={handleEditMileage}
              handleArchive={handleArchive}
              handleApprove={handleApprove}
              handleDeny={handleDeny}
              handlePay={handlePay}
              handleReset={handleReset}
              handlePreviewAttachment={handlePreviewAttachment}
            />
          )
        }}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true
        }}
      />

      <AdminEntryModals
        approveModalVisible={approveModalVisible}
        setApproveModalVisible={setApproveModalVisible}
        payModalVisible={payModalVisible}
        setPayModalVisible={setPayModalVisible}
        deleteOldArchivedModalVisible={deleteOldArchivedModalVisible}
        setDeleteOldArchivedModalVisible={setDeleteOldArchivedModalVisible}
        modalEntryIds={modalEntryIds}
        setSelectedRowKeys={setSelectedRowKeys}
        editState={editState}
        setEditState={setEditState}
        handleItemUpdate={handleItemUpdate}
        handleMileageUpdate={handleMileageUpdate}
        previewState={previewState}
        closePreview={closePreview}
      />
    </div>
  )
}
