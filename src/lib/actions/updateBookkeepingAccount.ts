'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { item, mileage } from '@/db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const BookkeepingAccountSchema = z.object({
  id: z.uuid(),
  account: z
    .string()
    .max(4)
    .regex(/^[0-9]{0,4}$/, 'Account must be 0-4 digits'),
  isMileage: z.boolean()
})

export const updateBookkeepingAccountAction = actionClient
  .inputSchema(BookkeepingAccountSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const now = new Date()
    if (parsedInput.isMileage) {
      await db
        .update(mileage)
        .set({
          account: parsedInput.account,
          updatedAt: now
        })
        .where(eq(mileage.id, parsedInput.id))
    } else {
      await db
        .update(item)
        .set({
          account: parsedInput.account,
          updatedAt: now
        })
        .where(eq(item.id, parsedInput.id))
    }

    updateTag('admin-entries')

    return { success: true }
  })
