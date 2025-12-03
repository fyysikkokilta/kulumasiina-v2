'use server'

import { inArray } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { entries } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ChangeStatusSchema = z.object({
  ids: z.array(z.uuid())
})

export const denyEntriesAction = actionClient
  .inputSchema(ChangeStatusSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const now = new Date()

    await db
      .update(entries)
      .set({
        status: 'denied',
        rejectionDate: now,
        updatedAt: now
      })
      .where(inArray(entries.id, parsedInput.ids))

    updateTag('admin-entries')

    return { success: true }
  })
