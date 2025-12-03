import { Key } from 'react'

import type {
  ItemWithAttachments,
  Mileage,
  NewAttachment,
  NewItemWithAttachments,
  NewMileage
} from '@/lib/db/schema'

import { ApproveModal } from './ApproveModal'
import { DeleteOldArchivedModal } from './DeleteOldArchivedModal'
import { ItemForm } from './ItemForm'
import { MileageForm } from './MileageForm'
import { PayModal } from './PayModal'
import type { PreviewState } from './PreviewModal'
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

interface AdminEntryModalsProps {
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
  handleItemUpdate: (
    itemData: Omit<NewItemWithAttachments, 'entryId' | 'attachments'> & {
      attachments: Omit<NewAttachment, 'itemId'>[]
    }
  ) => void
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

      <PreviewModal previewState={previewState} closePreview={closePreview} />
    </>
  )
}
