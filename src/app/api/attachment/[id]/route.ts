import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { isAuthorized } from '@/lib/auth'
import { db } from '@/lib/db'
import { attachments } from '@/lib/db/schema'
import { getFile } from '@/lib/storage'
import { isPdf } from '@/lib/validation'

export async function GET(request: NextRequest, { params }: RouteContext<'/api/attachment/[id]'>) {
  const { id } = await params
  const attachment = await db.query.attachments.findFirst({
    where: eq(attachments.fileId, id)
  })

  // Prevent public access to sent submissions
  const authorized = await isAuthorized()
  if (!!attachment && !authorized) {
    return new NextResponse(null, {
      status: 404
    })
  }

  let fileBuffer: Buffer
  try {
    fileBuffer = await getFile(id)
  } catch (e) {
    console.error(e)
    return new NextResponse('File not found', {
      status: 404
    })
  }

  // Guess mime type from filename extension
  const mimeType = isPdf(fileBuffer) ? 'application/pdf' : 'image/webp'

  return new NextResponse(Buffer.from(fileBuffer), {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(id)}"`
    }
  })
}
