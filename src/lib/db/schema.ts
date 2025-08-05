import { relations } from 'drizzle-orm'
import { boolean, pgEnum, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const statusEnum = pgEnum('status', ['submitted', 'approved', 'paid', 'denied'])

// Entries table (main expense claims)
export const entries = pgTable('entry', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(), // Payee name
  contact: text('contact').notNull(), // Contact information
  iban: text('iban').notNull(), // Bank account
  govId: text('gov_id'), // Government ID (required for mileages)
  title: text('title').notNull(), // Claim title/description
  status: statusEnum('status').notNull().default('submitted'), // submitted, approved, paid, denied, archived
  submissionDate: timestamp('submission_date').notNull(),
  approvalDate: timestamp('approval_date'),
  approvalNote: text('approval_note'),
  paidDate: timestamp('paid_date'),
  rejectionDate: timestamp('rejection_date'),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Items table (individual expense items)
export const items = pgTable('item', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => entries.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  account: text('account'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Mileages table (mileage claims)
export const mileages = pgTable('mileage', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => entries.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  route: text('route').notNull(),
  distance: real('distance').notNull(),
  plateNo: text('plate_no').notNull(),
  account: text('account'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Attachments table (files/receipts)
export const attachments = pgTable('attachment', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id')
    .notNull()
    .references(() => items.id, {
      onDelete: 'cascade'
    }),
  fileId: uuid('file_id').notNull(), // random filename for storage
  filename: text('filename').notNull(), // original filename for display
  value: real('value'),
  isNotReceipt: boolean('is_not_receipt').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

// Define relationships
export const entriesRelations = relations(entries, ({ many }) => ({
  items: many(items),
  mileages: many(mileages)
}))

export const itemsRelations = relations(items, ({ one, many }) => ({
  entry: one(entries, {
    fields: [items.entryId],
    references: [entries.id]
  }),
  attachments: many(attachments)
}))

export const mileagesRelations = relations(mileages, ({ one }) => ({
  entry: one(entries, {
    fields: [mileages.entryId],
    references: [entries.id]
  })
}))

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  item: one(items, {
    fields: [attachments.itemId],
    references: [items.id]
  })
}))

// Types (using Drizzle's built-in inference)
export type Entry = typeof entries.$inferSelect
export type NewEntry = typeof entries.$inferInsert
export type Item = typeof items.$inferSelect
export type NewItem = typeof items.$inferInsert
export type Mileage = typeof mileages.$inferSelect
export type NewMileage = typeof mileages.$inferInsert
export type Attachment = typeof attachments.$inferSelect
export type NewAttachment = typeof attachments.$inferInsert

export type ItemWithAttachments = Item & {
  attachments: Attachment[]
}

export type EntryWithItemsAndMileages = Entry & {
  items: ItemWithAttachments[]
  mileages: Mileage[]
}

export type NewItemWithAttachments = NewItem & {
  attachments: NewAttachment[]
}
