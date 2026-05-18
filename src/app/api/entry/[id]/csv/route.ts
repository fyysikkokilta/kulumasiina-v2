import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/db'
import {
  attachmentStorageErrorPayload,
  entryNotFoundErrorPayload,
  invalidEntryStatusErrorPayload
} from '@/lib/export-error'
import { generateCsv, generateCsvInfoFromEntry } from '@/utils/csv-utils'
import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'
import {
  AttachmentStorageError,
  generateCombinedPDF,
  generatePartsFromEntry
} from '@/utils/pdf-utils'

export async function GET(_request: NextRequest, { params }: RouteContext<'/api/entry/[id]/csv'>) {
  const cookieStore = await cookies()
  const token = cookieStore.get(JWT_COOKIE)?.value
  const authorized = await isAuthorized(token)
  if (!authorized) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const entryId = z.uuid().parse(id)

    // Get entry with all related data
    const entry = await db.query.entry.findFirst({
      where: {
        id: entryId
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

    if (!entry) {
      return NextResponse.json(entryNotFoundErrorPayload(entryId), { status: 404 })
    }

    if (!['approved', 'paid'].includes(entry.status)) {
      return NextResponse.json(invalidEntryStatusErrorPayload(entryId, entry.status), {
        status: 400
      })
    }

    // Generate PDF if entry is paid
    let pdf: { filename: string; data: Buffer } | undefined
    if (entry.status === 'paid') {
      const parts = await generatePartsFromEntry(entry)
      const pdfResult = await generateCombinedPDF(
        entryId,
        entry.status,
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
      pdf = pdfResult
    }

    // Generate CSV info
    const csvInfo = generateCsvInfoFromEntry(entry, pdf)

    // Generate CSV/ZIP
    const { filename, data } = await generateCsv([csvInfo])

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
      console.error('AttachmentStorageError during CSV export:', error.message, error.cause)
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
    console.error('Error generating CSV:', error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
      { status: 500 }
    )
  }
}
