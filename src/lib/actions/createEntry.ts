'use server'

import { isValidIBAN } from 'ibantools'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { db } from '../db'
import { attachments, entries, items, mileages } from '../db/schema'
import { validateFinnishSSN } from '../validation'
import { actionClient } from './safeActionClient'

const EntryCreateSchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  iban: z.string().refine((val) => isValidIBAN(val.replace(/\s/g, ''))),
  govId: z
    .string()
    .optional()
    .refine((val) => !val || validateFinnishSSN(val)),
  title: z.string().min(1),
  items: z.array(
    z.object({
      description: z.string().min(1),
      date: z.date(),
      account: z.string().nullish(),
      attachments: z.array(
        z.object({
          fileId: z.uuid(),
          filename: z.string(),
          value: z
            .number()
            .nullish()
            .refine((val) => !val || val > 0),
          isNotReceipt: z.boolean()
        })
      )
    })
  ),
  mileages: z.array(
    z.object({
      description: z.string().min(1),
      date: z.date(),
      route: z.string(),
      distance: z.number().refine((val) => val > 0),
      plateNo: z.string(),
      account: z.string().nullish()
    })
  )
})

export const createEntryAction = actionClient
  .inputSchema(EntryCreateSchema)
  .action(async ({ parsedInput }) => {
    const now = new Date()
    const hasItems = parsedInput.items.length > 0
    const hasMileages = parsedInput.mileages.length > 0

    // If both items and mileages exist, create two separate entries
    if (hasItems && hasMileages) {
      // Create entry for items (expenses)
      const createdEntries = await db.transaction(async (tx) => {
        const [expenseEntry] = await tx
          .insert(entries)
          .values({
            name: parsedInput.name,
            contact: parsedInput.contact,
            iban: parsedInput.iban,
            govId: null, // Regular expenses don't need govId
            title: parsedInput.title,
            status: 'submitted',
            submissionDate: now,
            createdAt: now,
            updatedAt: now
          })
          .returning()

        // Create items for expense entry
        for (const itemData of parsedInput.items) {
          const [item] = await tx
            .insert(items)
            .values({
              entryId: expenseEntry.id,
              description: itemData.description,
              date: itemData.date,
              account: itemData.account,
              createdAt: now,
              updatedAt: now
            })
            .returning()

          // Link attachments to this item
          if (itemData.attachments.length > 0) {
            for (const attachment of itemData.attachments) {
              await tx.insert(attachments).values({
                itemId: item.id,
                fileId: attachment.fileId,
                filename: attachment.filename,
                value: attachment.value,
                isNotReceipt: attachment.isNotReceipt,
                createdAt: now,
                updatedAt: now
              })
            }
          }
        }

        // Create entry for mileages (travel expenses)
        const [mileageEntry] = await tx
          .insert(entries)
          .values({
            name: parsedInput.name,
            contact: parsedInput.contact,
            iban: parsedInput.iban,
            govId: parsedInput.govId, // Travel expenses need govId
            title: parsedInput.title,
            status: 'submitted',
            submissionDate: now,
            createdAt: now,
            updatedAt: now
          })
          .returning()

        // Create mileages for travel entry
        await tx.insert(mileages).values(
          parsedInput.mileages.map((mileageData) => ({
            entryId: mileageEntry.id,
            description: mileageData.description,
            date: mileageData.date,
            route: mileageData.route,
            distance: mileageData.distance,
            plateNo: mileageData.plateNo,
            account: mileageData.account,
            createdAt: now,
            updatedAt: now
          }))
        )

        return [expenseEntry.id, mileageEntry.id]
      })

      return {
        success: true,
        entryIds: createdEntries,
        message: 'Created separate entries for expenses and travel costs'
      }
    }

    // Single entry logic (when only items OR only mileages exist)
    const entry = await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(entries)
        .values({
          name: parsedInput.name,
          contact: parsedInput.contact,
          iban: parsedInput.iban,
          govId: hasMileages ? parsedInput.govId : null, // Only set govId for mileage entries
          title: parsedInput.title,
          status: 'submitted',
          submissionDate: now,
          createdAt: now,
          updatedAt: now
        })
        .returning()

      // Create items if any
      if (hasItems) {
        for (const itemData of parsedInput.items) {
          const [item] = await tx
            .insert(items)
            .values({
              entryId: entry.id,
              description: itemData.description,
              date: itemData.date,
              account: itemData.account,
              createdAt: now,
              updatedAt: now
            })
            .returning()

          // Link attachments to this item
          if (itemData.attachments.length > 0) {
            for (const attachment of itemData.attachments) {
              await tx.insert(attachments).values({
                itemId: item.id,
                fileId: attachment.fileId,
                filename: attachment.filename,
                value: attachment.value,
                isNotReceipt: attachment.isNotReceipt,
                createdAt: now,
                updatedAt: now
              })
            }
          }
        }
      }

      // Create mileages if any
      if (hasMileages) {
        await tx.insert(mileages).values(
          parsedInput.mileages.map((mileageData) => ({
            entryId: entry.id,
            description: mileageData.description,
            date: mileageData.date,
            route: mileageData.route,
            distance: mileageData.distance,
            plateNo: mileageData.plateNo,
            account: mileageData.account,
            createdAt: now,
            updatedAt: now
          }))
        )
      }

      revalidatePath('/[locale]/admin', 'page')

      return entry
    })

    return {
      success: true,
      entryId: entry.id,
      entryIds: [entry.id]
    }
  })
