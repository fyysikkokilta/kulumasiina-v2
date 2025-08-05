'use server'

import { inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { entries } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ChangeStatusSchema = z.object({
  ids: z.array(z.uuid())
})

export const resetEntriesAction = actionClient
  .inputSchema(ChangeStatusSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const now = new Date()

    await db
      .update(entries)
      .set({
        status: 'submitted',
        approvalDate: null,
        approvalNote: null,
        paidDate: null,
        rejectionDate: null,
        updatedAt: now
      })
      .where(inArray(entries.id, parsedInput.ids))

    revalidatePath('/admin')
    return { success: true }
  })
