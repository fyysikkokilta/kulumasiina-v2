import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/db'
import {
  attachmentStorageErrorPayload,
  invalidEntryStatusErrorPayload,
  someEntriesNotFoundErrorPayload
} from '@/lib/export-error'
import { generateCsv, generateCsvInfoFromEntry } from '@/utils/csv-utils'
import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'
import {
  AttachmentStorageError,
  generateCombinedPDF,
  generatePartsFromEntry
} from '@/utils/pdf-utils'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(JWT_COOKIE)?.value
  const authorized = await isAuthorized(token)
  if (!authorized) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const entryIdsParam = searchParams.get('entry_ids')

    if (!entryIdsParam) {
      return NextResponse.json(
        { code: 'MISSING_ENTRY_IDS', message: 'Missing entry_ids parameter.' },
        { status: 400 }
      )
    }

    const rawEntryIds = entryIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)

    if (rawEntryIds.length === 0) {
      return NextResponse.json(
        { code: 'MISSING_ENTRY_IDS', message: 'No valid entry IDs provided.' },
        { status: 400 }
      )
    }

    const parsedEntryIds = z.array(z.uuid()).safeParse(rawEntryIds)

    if (!parsedEntryIds.success) {
      return NextResponse.json(
        { code: 'INVALID_ENTRY_IDS', message: 'One or more entry IDs are invalid.' },
        { status: 400 }
      )
    }

    const entryIds = parsedEntryIds.data

    // Get entries with all related data
    const entriesData = await db.query.entry.findMany({
      where: {
        id: { in: entryIds }
      },
      with: {
        items: {
          with: {
            attachments: true
          }
        },
        mileages: true
      }
    })

    if (entriesData.length !== entryIds.length) {
      const foundIds = new Set(entriesData.map((e) => e.id))
      const missing = entryIds.filter((id) => !foundIds.has(id))
      return NextResponse.json(someEntriesNotFoundErrorPayload(missing), { status: 404 })
    }

    // Check that all entries are paid
    const invalidEntries = entriesData.filter((entry) => entry.status !== 'paid')
    if (invalidEntries.length > 0) {
      const firstInvalid = invalidEntries[0]
      return NextResponse.json(
        invalidEntryStatusErrorPayload(firstInvalid.id, firstInvalid.status),
        { status: 400 }
      )
    }

    // Generate CSV infos with PDFs
    const csvInfos = await Promise.all(
      entriesData.map(async (entry) => {
        const parts = await generatePartsFromEntry(entry)
        const pdf = await generateCombinedPDF(
          entry.id,
          'paid',
          entry.name,
          entry.iban,
          entry.govId,
          new Date(entry.submissionDate),
          entry.title,
          parts,
          entry.approvalNote,
          entry.approvalDate ? new Date(entry.approvalDate) : null,
          entry.paidDate ? new Date(entry.paidDate) : null,
          entry.rejectionDate ? new Date(entry.rejectionDate) : null
        )

        return generateCsvInfoFromEntry(entry, pdf)
      })
    )

    // Generate CSV/ZIP
    const { filename, data } = await generateCsv(csvInfos)

    const mediaType = filename.endsWith('.zip') ? 'application/zip' : 'text/csv'

    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': mediaType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': data.length.toString()
      }
    })
  } catch (error) {
    if (error instanceof AttachmentStorageError) {
      console.error(
        'AttachmentStorageError during multi-entry ZIP export:',
        error.message,
        error.cause
      )
      return NextResponse.json(
        attachmentStorageErrorPayload(
          error.entryId,
          error.attachmentId,
          error.fileId,
          error.filename
        ),
        { status: 500 }
      )
    }
    console.error('Error generating multi-entry ZIP:', error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
