import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
  attachment: {
    item: r.one.item({
      from: r.attachment.itemId,
      to: r.item.id
    })
  },
  item: {
    attachments: r.many.attachment(),
    entry: r.one.entry({
      from: r.item.entryId,
      to: r.entry.id
    })
  },
  entry: {
    items: r.many.item(),
    mileages: r.many.mileage()
  },
  mileage: {
    entry: r.one.entry({
      from: r.mileage.entryId,
      to: r.entry.id
    })
  }
}))
