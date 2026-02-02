'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { mileages } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const MileageUpdateSchema = z.object({
  id: z.uuid(),
  description: z.string().min(1).max(500),
  date: z.date(),
  route: z.string().min(1).max(500),
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
    .nullish()
})

export const updateMileageAction = actionClient
  .inputSchema(MileageUpdateSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const { id, description, date, route, distance, plateNo, account } =
      parsedInput
    await db
      .update(mileages)
      .set({
        description,
        date,
        route,
        distance,
        plateNo,
        account,
        updatedAt: new Date()
      })
      .where(eq(mileages.id, id))

    updateTag('admin-entries')

    return { success: true }
  })
