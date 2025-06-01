import { eq } from 'drizzle-orm'
import mime from 'mime-types'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attachments } from '@/lib/db/schema'
import { getFile } from '@/lib/storage'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.fileId, id)
  })

  // Prevent public access to sent submissions
  // requireAuth() redirects to root if not authenticated
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  !!attachment && !(await requireAuth())

  // Fetch file from storage
  let fileBuffer: Buffer
  try {
    fileBuffer = await getFile(id)
  } catch (e) {
    console.error(e)
    return new NextResponse('File not found', { status: 404 })
  }

  // Guess mime type from filename extension
  const mimeType = mime.lookup(id) || 'application/octet-stream'

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(id)}"`
    }
  })
}
