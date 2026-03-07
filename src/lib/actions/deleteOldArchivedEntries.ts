'use server'

import { and, eq, lt, or } from 'drizzle-orm'
import { updateTag } from 'next/cache'

import { db } from '@/db'
import { entry } from '@/db/schema'
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
      .delete(entry)
      .where(
        and(
          eq(entry.archived, true),
          or(
            and(eq(entry.status, 'paid'), lt(entry.paidDate, limitDate)),
            and(eq(entry.status, 'denied'), lt(entry.rejectionDate, limitDate))
          )
        )
      )

    updateTag('admin-entries')

    return { success: true }
  })
