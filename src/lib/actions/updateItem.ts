'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { attachments, items } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ItemUpdateSchema = z.object({
  id: z.uuid(),
  description: z.string().min(1).max(500),
  date: z.date(),
  account: z
    .string()
    .max(4)
    .regex(/^[0-9]{0,4}$/, 'Account must be 0-4 digits'),
  attachments: z
    .array(
      z.object({
        fileId: z.uuid(),
        filename: z.string().min(1).max(255),
        value: z
          .number()
          .nullable()
          .refine((val) => !val || val > 0),
        isNotReceipt: z.boolean()
      })
    )
    .max(20, 'Maximum 20 attachments per item')
})

export const updateItemAction = actionClient
  .inputSchema(ItemUpdateSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const { id, attachments: attachmentUpdates, ...updateData } = parsedInput
    const now = new Date()
    await db.transaction(async (tx) => {
      await tx
        .update(items)
        .set({
          ...updateData,
          updatedAt: now
        })
        .where(eq(items.id, id))
      await tx.delete(attachments).where(eq(attachments.itemId, id))
      await tx.insert(attachments).values(
        attachmentUpdates.map((attachment) => ({
          itemId: id,
          fileId: attachment.fileId,
          filename: attachment.filename,
          value: attachment.value,
          isNotReceipt: attachment.isNotReceipt,
          createdAt: now,
          updatedAt: now
        }))
      )
    })

    updateTag('admin-entries')

    return { success: true }
  })
