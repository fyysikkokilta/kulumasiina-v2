'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { entry } from '@/db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const DeleteEntrySchema = z.object({ id: z.uuid() })

export const deleteEntryAction = actionClient
  .inputSchema(DeleteEntrySchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    await db.delete(entry).where(eq(entry.id, parsedInput.id))

    updateTag('admin-entries')

    return { success: true }
  })
