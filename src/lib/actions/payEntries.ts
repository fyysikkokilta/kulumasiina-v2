'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { updateTag } from 'next/cache'
import { z } from 'zod'

import { db } from '@/db'
import { entry } from '@/db/schema'
import type { EntryWithItemsAndMileages } from '@/db/types'
import { routing } from '@/i18n/routing'
import { env } from '@/lib/env'
import {
  createDocument,
  findAccountId,
  findDocumentsWithEntry,
  NocfoError,
  uploadFile
} from '@/lib/nocfo'
import {
  buildDocumentPayload,
  classifyExistingDocuments,
  documentDescription,
  documentLines,
  documentMarker,
  entriesMissingAccounts,
  type ExistingDocument,
  groupByPayee,
  TooManyEntriesError
} from '@/lib/nocfo-documents'
import {
  AttachmentStorageError,
  generateCombinedPDF,
  generatePartsFromEntry
} from '@/utils/pdf-utils'
import { isAuthorizedMiddleware } from './isAuthorized'
import { actionClient, ActionError } from './safeActionClient'

const PayEntriesSchema = z.object({
  ids: z.array(z.uuid()),
  date: z.date(),
  sendToNocfo: z.boolean(),
  locale: z.enum(routing.locales)
})

type Translate = Awaited<ReturnType<typeof getTranslations<'PayModal'>>>
type PayFailure = { entryIds: string[]; reason: string }
type Group = EntryWithItemsAndMileages[]

const titlesOf = (entries: Group) => [...new Set(entries.map((e) => e.title))].join(', ')

const accountNumbersOf = (entries: Group) =>
  entries.flatMap(documentLines).flatMap((line) => (line.accountNumber ? [line.accountNumber] : []))

async function resolveAccountIds(numbers: string[]): Promise<Map<string, number | null>> {
  const unique = [...new Set(numbers)]
  const ids = await Promise.all(unique.map((n) => findAccountId(n)))
  return new Map(unique.map((n, i) => [n, ids[i]]))
}

async function buildPdfs(group: Group, paidDate: Date) {
  return Promise.all(
    group.map(async (e) => {
      const parts = await generatePartsFromEntry(e)
      return generateCombinedPDF(
        e.id,
        'paid',
        e.name,
        e.iban,
        e.govId,
        new Date(e.submissionDate),
        e.title,
        parts,
        e.approvalNote,
        e.approvalDate ? new Date(e.approvalDate) : null,
        paidDate,
        e.rejectionDate ? new Date(e.rejectionDate) : null
      )
    })
  )
}

function failureReason(error: unknown, t: Translate): string {
  if (error instanceof TooManyEntriesError) return t('failed_too_many_entries')
  if (error instanceof AttachmentStorageError) return t('failed_attachment')
  if (error instanceof NocfoError) return t('failed_nocfo')
  return t('failed_unexpected')
}

async function findExistingDocument(entryIds: string[]): Promise<ExistingDocument> {
  const found = (await Promise.all(entryIds.map(findDocumentsWithEntry))).flat()
  const byId = new Map(found.map((d) => [d.id, d]))
  return classifyExistingDocuments(entryIds, [...byId.values()])
}

async function createGroupDocument(
  group: Group,
  paidDate: Date,
  accountIds: Map<string, number | null>,
  bankAccountId: number
): Promise<number> {
  const pdfs = await buildPdfs(group, paidDate)
  const attachmentIds = await Promise.all(pdfs.map((pdf) => uploadFile(pdf.filename, pdf.data)))
  const payload = buildDocumentPayload({
    entries: group,
    paidDate,
    accountIds: new Map([...accountIds].flatMap(([n, id]) => (id === null ? [] : [[n, id]]))),
    bankAccountId,
    attachmentIds
  })
  const marker = documentMarker(group.map((e) => e.id))
  return createDocument(payload, `${marker}|${paidDate.toISOString().slice(0, 10)}`)
}

async function markPaid(entryIds: string[], paidDate: Date, documentId: number) {
  const updated = await db
    .update(entry)
    .set({ status: 'paid', paidDate, nocfoDocumentId: documentId })
    .where(and(inArray(entry.id, entryIds), eq(entry.status, 'approved')))
    .returning({ id: entry.id })
  if (updated.length < entryIds.length) {
    const updatedIds = new Set(updated.map((e) => e.id))
    console.error('Fewer entries marked paid than sent to NoCFO', {
      documentId,
      entryIds,
      notUpdated: entryIds.filter((id) => !updatedIds.has(id))
    })
  }
}

async function sendGroup(
  group: Group,
  paidDate: Date,
  accountIds: Map<string, number | null>,
  bankAccountId: number,
  t: Translate
): Promise<PayFailure | null> {
  const entryIds = group.map((e) => e.id)
  const prefix = titlesOf(group)
  const numbers = accountNumbersOf(group)
  if (numbers.length === 0) return { entryIds, reason: `${prefix}: ${t('failed_no_lines')}` }
  const unknown = [...new Set(numbers)].filter((n) => !accountIds.get(n))
  if (unknown.length > 0) {
    return {
      entryIds,
      reason: `${prefix}: ${t('failed_unknown_account', { accounts: unknown.join(', ') })}`
    }
  }

  try {
    // Fails fast, before any NoCFO call, when the group's marker cannot fit
    documentDescription(group)
    const existing = await findExistingDocument(entryIds)
    if (existing.kind === 'conflict') {
      return {
        entryIds,
        reason: `${prefix}: ${t('failed_existing_document', { id: String(existing.documentId) })}`
      }
    }
    const documentId =
      existing.kind === 'match'
        ? existing.documentId
        : await createGroupDocument(group, paidDate, accountIds, bankAccountId)
    await markPaid(entryIds, paidDate, documentId)
    return null
  } catch (error) {
    const detail = error instanceof NocfoError ? { status: error.status, body: error.body } : error
    console.error('Failed to send entries to NoCFO', entryIds, detail)
    return { entryIds, reason: `${prefix}: ${failureReason(error, t)}` }
  }
}

async function payViaNocfo(entries: Group, paidDate: Date, t: Translate): Promise<PayFailure[]> {
  const missing = new Set(entriesMissingAccounts(entries))
  if (missing.size > 0) {
    const titles = titlesOf(entries.filter((e) => missing.has(e.id)))
    throw new ActionError(t('error_missing_accounts', { titles }))
  }

  const groups = groupByPayee(entries)
  let accountIds: Map<string, number | null>
  try {
    accountIds = await resolveAccountIds([...accountNumbersOf(entries), env.NOCFO_BANK_ACCOUNT])
  } catch (error) {
    console.error(
      'Failed to resolve NoCFO accounts',
      error instanceof NocfoError ? error.body : error
    )
    return groups.map((g) => ({
      entryIds: g.map((e) => e.id),
      reason: `${titlesOf(g)}: ${failureReason(error, t)}`
    }))
  }

  const bankAccountId = accountIds.get(env.NOCFO_BANK_ACCOUNT)
  if (!bankAccountId) {
    return groups.map((g) => ({
      entryIds: g.map((e) => e.id),
      reason: `${titlesOf(g)}: ${t('failed_unknown_account', { accounts: env.NOCFO_BANK_ACCOUNT })}`
    }))
  }

  const failed: PayFailure[] = []
  for (const group of groups) {
    const failure = await sendGroup(group, paidDate, accountIds, bankAccountId, t)
    if (failure) failed.push(failure)
  }
  return failed
}

export const payEntriesAction = actionClient
  .inputSchema(PayEntriesSchema)
  .use(isAuthorizedMiddleware)
  .action(async ({ parsedInput }) => {
    const paidDate = new Date(parsedInput.date)

    if (!parsedInput.sendToNocfo) {
      await db
        .update(entry)
        .set({ status: 'paid', paidDate })
        .where(and(inArray(entry.id, parsedInput.ids), eq(entry.status, 'approved')))
      updateTag('admin-entries')
      return { success: true as const, failed: [] as PayFailure[] }
    }

    const t = await getTranslations({ locale: parsedInput.locale, namespace: 'PayModal' })
    const entries = await db.query.entry.findMany({
      where: { id: { in: parsedInput.ids } },
      with: { items: { with: { attachments: true } }, mileages: true }
    })
    const foundIds = new Set(entries.map((e) => e.id))
    const notPayable = [
      ...entries.filter((e) => e.status !== 'approved').map((e) => e.title),
      ...parsedInput.ids.filter((id) => !foundIds.has(id))
    ]
    if (notPayable.length > 0) {
      throw new ActionError(t('error_not_approved', { titles: notPayable.join(', ') }))
    }

    const failed = await payViaNocfo(entries, paidDate, t)
    updateTag('admin-entries')
    return { success: true as const, failed }
  })
