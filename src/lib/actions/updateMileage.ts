'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { mileages } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const MileageUpdateSchema = z.object({
  id: z.uuid(),
  description: z
    .string()
    .min(1)
    .max(500)
    .regex(/^[^<>{}]*$/, 'Description contains invalid characters'),
  date: z.date(),
  route: z
    .string()
    .min(1)
    .max(500)
    .regex(/^[^<>{}]*$/, 'Route contains invalid characters'),
  distance: z.number().refine((val) => val > 0),
  plateNo: z
    .string()
    .min(1)
    .max(12)
    .regex(/^[A-Za-zÅÄÖåäö0-9-]*$/, 'Invalid plate number format')
    .transform((val) => val.toUpperCase()),
  account: z
    .string()
    .max(4)
    .regex(/^[0-9]{0,4}$/, 'Account must be 0-4 digits')
})

export const updateMileageAction = actionClient
  .inputSchema(MileageUpdateSchema)
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

    revalidatePath('/[locale]/admin', 'page')

    return { success: true }
  })
