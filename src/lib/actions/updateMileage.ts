'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { mileages } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const MileageUpdateSchema = z.object({
  id: z.number(),
  description: z.string(),
  date: z.date(),
  route: z.string(),
  distance: z.number().refine((val) => val > 0),
  plateNo: z.string(),
  account: z.string()
})

export const updateMileageAction = actionClient
  .schema(MileageUpdateSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const { id, ...updateData } = parsedInput
    const now = new Date()
    await db
      .update(mileages)
      .set({
        ...updateData,
        plateNo: updateData.plateNo,
        updatedAt: now
      })
      .where(eq(mileages.id, id))
    revalidatePath('/admin')
    return { success: true }
  })
