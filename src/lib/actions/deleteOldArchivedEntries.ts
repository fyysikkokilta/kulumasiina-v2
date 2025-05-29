'use server'

import { and, eq, lt, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

import { db } from '../db'
import { entries } from '../db/schema'
import { env } from '../env'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

export const deleteOldArchivedEntriesAction = actionClient
  .use(isAuthorizedMiddleware)
  .action(async () => {
    const ageLimitDays = env.NEXT_PUBLIC_ARCHIVED_ENTRIES_AGE_LIMIT_DAYS
    const limitDate = new Date()
    limitDate.setDate(limitDate.getDate() - ageLimitDays)
    await db
      .delete(entries)
      .where(
        and(
          eq(entries.archived, true),
          or(
            and(eq(entries.status, 'paid'), lt(entries.paidDate, limitDate)),
            and(eq(entries.status, 'denied'), lt(entries.rejectionDate, limitDate))
          )
        )
      )
    revalidatePath('/admin')
    return { success: true }
  })
