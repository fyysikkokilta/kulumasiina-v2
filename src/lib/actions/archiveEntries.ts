'use server'

import { inArray } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { entry } from '@/db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ArchiveEntriesSchema = z.object({
  ids: z.array(z.uuid())
})

export const archiveEntriesAction = actionClient
  .inputSchema(ArchiveEntriesSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const now = new Date()

    await db
      .update(entry)
      .set({
        archived: true,
        updatedAt: now
      })
      .where(inArray(entry.id, parsedInput.ids))

    updateTag('admin-entries')

    return { success: true }
  })
