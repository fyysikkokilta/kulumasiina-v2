import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { attachments } from '@/lib/db/schema'
import { getMimeType } from '@/lib/file-utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await requireAuth()
  const attachmentId = parseInt(id)
  if (isNaN(attachmentId)) {
    return new NextResponse('Invalid attachment ID', { status: 400 })
  }

  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.id, attachmentId)
  })

  if (!attachment) {
    return new NextResponse('Attachment not found', { status: 404 })
  }

  const mimeType = getMimeType(attachment.data)

  return new NextResponse(attachment.data, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`
    }
  })
}
