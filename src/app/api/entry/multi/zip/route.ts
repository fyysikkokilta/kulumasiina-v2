import { inArray } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { generateCsv, generateCsvInfoFromEntry } from '@/lib/csv-utils'
import { db } from '@/lib/db'
import { entries } from '@/lib/db/schema'
import { generateCombinedPDF, generatePartsFromEntry } from '@/lib/pdf-utils'
import isAuthorized, { JWT_COOKIE } from '@/utils/isAuthorized'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get(JWT_COOKIE)?.value
  const authorized = await isAuthorized(token)
  if (!authorized) {
    return new NextResponse('Unauthorized', { status: 404 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const entryIdsParam = searchParams.get('entry_ids')

    if (!entryIdsParam) {
      return new NextResponse('Missing entry_ids parameter', { status: 400 })
    }

    const entryIds = entryIdsParam.split(',').map((id) => z.uuid().parse(id.trim()))

    if (entryIds.length === 0) {
      return new NextResponse('No valid entry IDs provided', { status: 400 })
    }

    // Get entries with all related data
    const entriesData = await db.query.entries.findMany({
      where: inArray(entries.id, entryIds),
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
      return new NextResponse('Some entries not found', { status: 404 })
    }

    // Check that all entries are paid
    const invalidEntries = entriesData.filter((entry) => entry.status !== 'paid')
    if (invalidEntries.length > 0) {
      return new NextResponse('All entries must be paid for CSV generation', {
        status: 400
      })
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

    return new NextResponse(Buffer.from(data), {
      status: 200,
      headers: {
        'Content-Type': mediaType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': data.length.toString()
      }
    })
  } catch (error) {
    console.error('Error generating multi-entry CSV:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
