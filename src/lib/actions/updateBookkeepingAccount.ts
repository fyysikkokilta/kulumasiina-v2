'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { items, mileages } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const BookkeepingAccountSchema = z.object({
  id: z.number(),
  account: z.string(),
  isMileage: z.boolean()
})

export const updateBookkeepingAccountAction = actionClient
  .schema(BookkeepingAccountSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const now = new Date()
    if (parsedInput.isMileage) {
      await db
        .update(mileages)
        .set({
          account: parsedInput.account,
          updatedAt: now
        })
        .where(eq(mileages.id, parsedInput.id))
    } else {
      await db
        .update(items)
        .set({
          account: parsedInput.account,
          updatedAt: now
        })
        .where(eq(items.id, parsedInput.id))
    }
    revalidatePath('/admin')
    return { success: true }
  })
