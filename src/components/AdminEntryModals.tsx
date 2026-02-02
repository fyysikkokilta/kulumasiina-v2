import type { Key } from 'react'

import type {
  FormItemWithAttachments,
  FormMileage,
  ItemWithAttachments,
  Mileage
} from '@/lib/db/schema'
import { type PreviewState } from '@/utils/preview-utils'

import { ApproveModal } from './ApproveModal'
import { DeleteOldArchivedModal } from './DeleteOldArchivedModal'
import { ItemForm } from './ItemForm'
import { MileageForm } from './MileageForm'
import { PayModal } from './PayModal'
import { PreviewModal } from './PreviewModal'

export type EditState = {
  entryId: string
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

export interface AdminEntryModalsProps {
  modals: {
    approveModalVisible: boolean
    setApproveModalVisible: (v: boolean) => void
    payModalVisible: boolean
    setPayModalVisible: (v: boolean) => void
    deleteOldArchivedModalVisible: boolean
    setDeleteOldArchivedModalVisible: (v: boolean) => void
    modalEntryIds: string[]
    setSelectedRowKeys: (v: Key[]) => void
    editState: EditState | null
    setEditState: (v: EditState | null) => void
    handleItemUpdate: (itemData: FormItemWithAttachments) => void
    handleMileageUpdate: (mileageData: FormMileage) => void
    updateItemStatus: string
    updateMileageStatus: string
    previewState: PreviewState | null
    closePreview: () => void
  }
}

export function AdminEntryModals({ modals }: AdminEntryModalsProps) {
  const {
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
    updateItemStatus,
    updateMileageStatus,
    previewState,
    closePreview
  } = modals

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
          isSubmitting={updateItemStatus === 'executing'}
        />
      )}

      {editState?.type === 'mileage' && editState.data && (
        <MileageForm
          visible={true}
          onOk={handleMileageUpdate}
          onCancel={() => setEditState(null)}
          editData={editState.data}
          isSubmitting={updateMileageStatus === 'executing'}
        />
      )}

      <PreviewModal previewState={previewState} closePreview={closePreview} />
    </>
  )
}
