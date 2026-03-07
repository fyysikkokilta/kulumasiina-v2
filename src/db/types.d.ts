import type { entry, item, mileage, attachment } from '@/db/schema'

export type Entry = typeof entry.$inferSelect
export type NewEntry = typeof entry.$inferInsert
export type Item = typeof item.$inferSelect
export type NewItem = typeof item.$inferInsert
export type Mileage = typeof mileage.$inferSelect
export type NewMileage = typeof mileage.$inferInsert
export type Attachment = typeof attachment.$inferSelect
export type NewAttachment = typeof attachment.$inferInsert

export type ItemWithAttachments = Item & {
  attachments: Attachment[]
}

export type EntryWithItemsAndMileages = Entry & {
  items: ItemWithAttachments[]
  mileages: Mileage[]
}

export type FormItemWithAttachments = Omit<
  ItemWithAttachments | NewItem,
  'entryId' | 'attachments'
> & {
  attachments: Omit<NewAttachment, 'itemId'>[]
}

export type FormMileage = Omit<Mileage | NewMileage, 'entryId'>

export type FormEntry = FormItemWithAttachments | FormMileage
