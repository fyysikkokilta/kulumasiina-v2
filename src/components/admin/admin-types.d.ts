import type { Item, Mileage } from '@/lib/db/schema'

export type EditState = {
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

export interface PreviewState {
  open: boolean
  url: string
  title: string
  isImage: boolean
  isNotReceipt: boolean
  value: number | null
}
