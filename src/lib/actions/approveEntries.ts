'use server'

import { inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { entries } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const ApproveEntriesSchema = z.object({
  ids: z.array(z.uuid()),
  date: z.date(),
  approval_note: z
    .string()
    .max(100)
    .regex(/^[^<>{}]*$/, 'Approval note contains invalid characters')
})

export const approveEntriesAction = actionClient
  .inputSchema(ApproveEntriesSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const approvalDate = new Date(parsedInput.date)
    const now = new Date()

    await db
      .update(entries)
      .set({
        status: 'approved',
        approvalDate,
        approvalNote: parsedInput.approval_note,
        updatedAt: now
      })
      .where(inArray(entries.id, parsedInput.ids))

    revalidatePath('/[locale]/admin', 'page')

    return { success: true }
  })
