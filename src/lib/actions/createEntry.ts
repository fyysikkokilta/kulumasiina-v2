'use server'

import { isValidIBAN } from 'ibantools'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { validateFinnishSSN } from '@/utils/validation'

import { db } from '@/db'
import { attachment, entry, item, mileage } from '@/db/schema'
import { actionClient } from './safeActionClient'

const EntryCreateSchema = z.object({
  name: z.string().min(1).max(255),
  contact: z.string().min(1).max(255),
  iban: z.string().refine((val) => isValidIBAN(val.replace(/\s/g, ''))),
  govId: z
    .string()
    .optional()
    .refine((val) => !val || validateFinnishSSN(val)),
  title: z.string().min(1).max(1000),
  items: z
    .array(
      z.object({
        description: z.string().min(1).max(500),
        date: z.date(),
        account: z
          .string()
          .max(4)
          .regex(/^[0-9]{0,4}$/, 'Account must be 0-4 digits')
          .nullish(),
        attachments: z
          .array(
            z.object({
              fileId: z.uuid(),
              filename: z.string().min(1).max(255),
              value: z
                .number()
                .nullish()
                .refine((val) => !val || val > 0),
              isNotReceipt: z.boolean()
            })
          )
          .max(20, 'Maximum 20 attachments per item')
      })
    )
    .max(20, 'Maximum 20 items per entry'),
  mileages: z
    .array(
      z.object({
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
    )
    .max(20, 'Maximum 20 mileages per entry')
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
          .insert(entry)
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
          const [itemResult] = await tx
            .insert(item)
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
            for (const attachmentData of itemData.attachments) {
              await tx.insert(attachment).values({
                itemId: itemResult.id,
                fileId: attachmentData.fileId,
                filename: attachmentData.filename,
                value: attachmentData.value,
                isNotReceipt: attachmentData.isNotReceipt,
                createdAt: now,
                updatedAt: now
              })
            }
          }
        }

        // Create entry for mileages (travel expenses)
        const [mileageEntry] = await tx
          .insert(entry)
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
        await tx.insert(mileage).values(
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
    const entryResult = await db.transaction(async (tx) => {
      const [innerEntryResult] = await tx
        .insert(entry)
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
          const [innerItemResult] = await tx
            .insert(item)
            .values({
              entryId: innerEntryResult.id,
              description: itemData.description,
              date: itemData.date,
              account: itemData.account,
              createdAt: now,
              updatedAt: now
            })
            .returning()

          // Link attachments to this item
          if (itemData.attachments.length > 0) {
            for (const attachmentData of itemData.attachments) {
              await tx.insert(attachment).values({
                itemId: innerItemResult.id,
                fileId: attachmentData.fileId,
                filename: attachmentData.filename,
                value: attachmentData.value,
                isNotReceipt: attachmentData.isNotReceipt,
                createdAt: now,
                updatedAt: now
              })
            }
          }
        }
      }

      // Create mileages if any
      if (hasMileages) {
        await tx.insert(mileage).values(
          parsedInput.mileages.map((mileageData) => ({
            entryId: innerEntryResult.id,
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

      updateTag('admin-entries')

      return innerEntryResult
    })

    return {
      success: true,
      entryId: entryResult.id,
      entryIds: [entryResult.id]
    }
  })
