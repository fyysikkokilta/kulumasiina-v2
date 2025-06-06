'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { entries } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ApproveEntriesSchema = z.object({
  ids: z.array(z.number()),
  date: z.date(),
  approval_note: z.string()
})

export const approveEntriesAction = actionClient
  .schema(ApproveEntriesSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const approvalDate = new Date(parsedInput.date)
    const now = new Date()

    for (const id of parsedInput.ids) {
      await db
        .update(entries)
        .set({
          status: 'approved',
          approvalDate,
          approvalNote: parsedInput.approval_note,
          updatedAt: now
        })
        .where(eq(entries.id, id))
    }

    revalidatePath('/admin')
    return { success: true }
  })
