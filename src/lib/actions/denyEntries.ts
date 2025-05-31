'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { entries } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ChangeStatusSchema = z.object({
  ids: z.array(z.number())
})

export const denyEntriesAction = actionClient
  .schema(ChangeStatusSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const now = new Date()
    for (const id of parsedInput.ids) {
      await db
        .update(entries)
        .set({
          status: 'denied',
          rejectionDate: now,
          updatedAt: now
        })
        .where(eq(entries.id, id))
    }
    revalidatePath('/admin')
    return { success: true }
  })
