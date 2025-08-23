'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { entries } from '../db/schema'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient } from './safeActionClient'

const DeleteEntrySchema = z.object({ id: z.uuid() })

export const deleteEntryAction = actionClient
  .inputSchema(DeleteEntrySchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    await db.delete(entries).where(eq(entries.id, parsedInput.id))

    revalidatePath('/[locale]/admin', 'page')

    return { success: true }
  })
