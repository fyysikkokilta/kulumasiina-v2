'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { attachments, items } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ItemUpdateSchema = z.object({
  id: z.number(),
  description: z.string(),
  date: z.date(),
  account: z.string(),
  attachments: z.array(
    z.object({
      fileId: z.string(),
      filename: z.string(),
      value: z
        .number()
        .nullable()
        .refine((val) => !val || val > 0),
      isNotReceipt: z.boolean()
    })
  )
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
    revalidatePath('/admin')
    return { success: true }
  })
