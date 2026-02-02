'use server'

import { inArray } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { entries } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ApproveEntriesSchema = z.object({
  ids: z.array(z.uuid()),
  date: z.date(),
  approvalNote: z.string().min(1).max(100)
})

export const approveEntriesAction = actionClient
  .inputSchema(ApproveEntriesSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    await db
      .update(entries)
      .set({
        status: 'approved',
        approvalDate: parsedInput.date,
        approvalNote: parsedInput.approvalNote,
        updatedAt: new Date()
      })
      .where(inArray(entries.id, parsedInput.ids))

    updateTag('admin-entries')

    return { success: true }
  })
