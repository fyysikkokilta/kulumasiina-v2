'use server'

import { inArray } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { entry } from '@/db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const PayEntriesSchema = z.object({
  ids: z.array(z.uuid()),
  date: z.date()
})

export const payEntriesAction = actionClient
  .inputSchema(PayEntriesSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const paidDate = new Date(parsedInput.date)

    await db
      .update(entry)
      .set({
        status: 'paid',
        paidDate
      })
      .where(inArray(entry.id, parsedInput.ids))

    updateTag('admin-entries')

    return { success: true }
  })
