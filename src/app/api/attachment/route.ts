import { compress } from 'compress-pdf'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

import { saveFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  // Always expect multipart/form-data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const originalName = formData.get('filename') as string | null
  if (!file || !originalName) {
    return new NextResponse('Missing file or filename', { status: 400 })
  }
  let ext = originalName.includes('.') ? originalName.substring(originalName.lastIndexOf('.')) : ''
  const mimeType = file.type
  let buffer = Buffer.from(await file.arrayBuffer())

  // If image, compress/resize with sharp
  if (mimeType.startsWith('image/')) {
    try {
      const image = sharp(buffer)
      const metadata = await image.metadata()
      const isWiderThanTall = metadata.width > metadata.height

      buffer = await sharp(buffer)
        .resize({
          width: isWiderThanTall ? 1920 : 1080,
          height: isWiderThanTall ? 1080 : 1920,
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp()
        .toBuffer()
      ext = '.webp'
    } catch (e) {
      console.error('Failed to compress image', e)
      return new NextResponse('Failed to compress image', { status: 500 })
    }
  }

  // If pdf, compress with compress-pdf
  if (mimeType.startsWith('application/pdf')) {
    buffer = await compress(buffer)
    ext = '.pdf'
  }

  const fileId = uuidv4() + ext

  await saveFile(fileId, buffer)

  return NextResponse.json({ fileId, filename: originalName })
}
