import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { db } from '@/lib/db'
import { entries } from '@/lib/db/schema'
import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'
import { generateCombinedPDF, generatePartsFromEntry } from '@/utils/pdf-utils'

export async function GET(request: NextRequest, { params }: RouteContext<'/api/entry/[id]/pdf'>) {
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

    if (!['approved', 'paid', 'submitted', 'denied'].includes(entry.status)) {
      return new NextResponse('Invalid entry status for PDF generation', {
        status: 400
      })
    }

    // Generate parts from entry data
    const parts = await generatePartsFromEntry(entry)

    // Generate PDF
    const { filename, data } = await generateCombinedPDF(
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

    return new NextResponse(Buffer.from(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': data.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
