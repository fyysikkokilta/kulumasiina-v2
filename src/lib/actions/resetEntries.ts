'use server'

import { inArray } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { entry } from '@/db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ChangeStatusSchema = z.object({
  ids: z.array(z.uuid())
})

export const resetEntriesAction = actionClient
  .inputSchema(ChangeStatusSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    await db
      .update(entry)
      .set({
        status: 'submitted',
        approvalDate: null,
        approvalNote: null,
        paidDate: null,
        rejectionDate: null
      })
      .where(inArray(entry.id, parsedInput.ids))

    updateTag('admin-entries')

    return { success: true }
  })
