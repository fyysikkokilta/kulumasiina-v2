import { pgEnum, pgTable, text, timestamp, real, boolean, uuid } from 'drizzle-orm/pg-core'

export const status = pgEnum('status', ['submitted', 'approved', 'paid', 'denied'])

export const attachment = pgTable('attachment', {
  filename: text('filename').notNull(),
  value: real('value'),
  isNotReceipt: boolean('is_not_receipt').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  fileId: uuid('file_id').notNull(),
  id: uuid('id').defaultRandom().primaryKey(),
  itemId: uuid('item_id')
    .notNull()
    .references(() => item.id, { onDelete: 'cascade' })
})

export const entry = pgTable('entry', {
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  iban: text('iban').notNull(),
  govId: text('gov_id'),
  title: text('title').notNull(),
  status: status().default('submitted').notNull(),
  submissionDate: timestamp('submission_date').notNull(),
  approvalDate: timestamp('approval_date'),
  approvalNote: text('approval_note'),
  paidDate: timestamp('paid_date'),
  rejectionDate: timestamp('rejection_date'),
  archived: boolean('archived').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  id: uuid('id').defaultRandom().primaryKey()
})

export const item = pgTable('item', {
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  account: text('account'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  id: uuid('id').defaultRandom().primaryKey(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => entry.id, { onDelete: 'cascade' })
})

export const mileage = pgTable('mileage', {
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  route: text('route').notNull(),
  distance: real().notNull(),
  plateNo: text('plate_no').notNull(),
  account: text('account'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  id: uuid('id').defaultRandom().primaryKey(),
  entryId: uuid('entry_id')
    .notNull()
    .references(() => entry.id, { onDelete: 'cascade' })
})
