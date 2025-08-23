import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { generateCsv, generateCsvInfoFromEntry } from '@/lib/csv-utils'
import { db } from '@/lib/db'
import { entries } from '@/lib/db/schema'
import { generateCombinedPDF, generatePartsFromEntry } from '@/lib/pdf-utils'
import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'

export async function GET(request: NextRequest, { params }: RouteContext<'/api/entry/[id]/csv'>) {
  const cookieStore = await cookies()
  const token = cookieStore.get(JWT_COOKIE)?.value
  const authorized = await isAuthorized(token)
  if (!authorized) {
    return new NextResponse('Unauthorized', { status: 404 })
  }

  try {
    const { id } = await params
    const entryId = z.uuid().parse(id)

    // Get entry with all related data
    const entry = await db.query.entries.findFirst({
      where: eq(entries.id, entryId),
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
      return new NextResponse('Entry not found', { status: 404 })
    }

    if (!['approved', 'paid'].includes(entry.status)) {
      return new NextResponse('Invalid entry status for CSV generation', {
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

    return new NextResponse(Buffer.from(data), {
      status: 200,
      headers: {
        'Content-Type': mediaType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': data.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
