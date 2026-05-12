import { pgEnum, text, timestamp, real, boolean, uuid, snakeCase } from 'drizzle-orm/pg-core'

export const status = pgEnum('status', ['submitted', 'approved', 'paid', 'denied'])

export const attachment = snakeCase.table('attachment', {
  filename: text().notNull(),
  value: real(),
  isNotReceipt: boolean().notNull(),
  fileId: uuid().notNull(),
  id: uuid().defaultRandom().primaryKey(),
  itemId: uuid()
    .notNull()
    .references(() => item.id, { onDelete: 'cascade' })
})

export const entry = snakeCase.table('entry', {
  name: text().notNull(),
  contact: text().notNull(),
  iban: text().notNull(),
  govId: text(),
  title: text().notNull(),
  status: status().default('submitted').notNull(),
  submissionDate: timestamp().notNull(),
  approvalDate: timestamp(),
  approvalNote: text(),
  paidDate: timestamp(),
  rejectionDate: timestamp(),
  archived: boolean().default(false),
  id: uuid().defaultRandom().primaryKey()
})

export const item = snakeCase.table('item', {
  description: text().notNull(),
  date: timestamp().notNull(),
  account: text(),
  id: uuid().defaultRandom().primaryKey(),
  entryId: uuid()
    .notNull()
    .references(() => entry.id, { onDelete: 'cascade' })
})

export const mileage = snakeCase.table('mileage', {
  description: text().notNull(),
  date: timestamp().notNull(),
  route: text().notNull(),
  distance: real().notNull(),
  plateNo: text().notNull(),
  account: text(),
  id: uuid().defaultRandom().primaryKey(),
  entryId: uuid()
    .notNull()
    .references(() => entry.id, { onDelete: 'cascade' })
})
