import { Modal } from 'antd'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import React from 'react'

import { NewMileage } from '@/lib/db/schema'
import { NewItemWithAttachments } from '@/lib/db/schema'

import { ItemForm } from '../ItemForm'
import { MileageForm } from '../MileageForm'
import type { EditState, PreviewState } from './admin-types'
import { ApproveModal } from './ApproveModal'
import { DeleteOldArchivedModal } from './DeleteOldArchivedModal'
import { PayModal } from './PayModal'

interface AdminEntryModalsProps {
  approveModalVisible: boolean
  setApproveModalVisible: (v: boolean) => void
  payModalVisible: boolean
  setPayModalVisible: (v: boolean) => void
  deleteOldArchivedModalVisible: boolean
  setDeleteOldArchivedModalVisible: (v: boolean) => void
  modalEntryIds: number[]
  setSelectedRowKeys: (v: React.Key[]) => void
  editState: EditState | null
  setEditState: (v: EditState | null) => void
  handleItemUpdate: (itemData: Omit<NewItemWithAttachments, 'entryId'>) => void
  handleMileageUpdate: (mileageData: Omit<NewMileage, 'entryId'>) => void
  previewState: PreviewState
  closePreview: () => void
}

export function AdminEntryModals({
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
  closePreview
}: AdminEntryModalsProps) {
  const t = useTranslations('admin')
  return (
    <>
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
    </>
  )
}
