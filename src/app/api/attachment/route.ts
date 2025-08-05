import { compress } from 'compress-pdf'
import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

import { saveFile } from '@/lib/storage'

export async function POST(request: NextRequest) {
  // Always expect multipart/form-data
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const originalName = formData.get('filename') as string | null
  if (!file || !originalName) {
    return new NextResponse('Missing file or filename', { status: 400 })
  }
  const mimeType = file.type
  const fileBuffer = Buffer.from(await file.arrayBuffer())
  let buffer: Buffer

  // If image, compress/resize with sharp
  if (mimeType.startsWith('image/')) {
    try {
      const image = sharp(fileBuffer)
      const metadata = await image.metadata()
      const isWiderThanTall = metadata.autoOrient.width > metadata.autoOrient.height

      buffer = await image
        .autoOrient()
        .resize({
          width: isWiderThanTall ? 1920 : 1080,
          height: isWiderThanTall ? 1080 : 1920,
          withoutEnlargement: true,
          fit: 'inside'
        })
        .webp()
        .toBuffer()
    } catch (e) {
      console.error('Failed to compress image', e)
      return new NextResponse('Failed to compress image', { status: 500 })
    }
  }

  // If pdf, compress with compress-pdf
  if (mimeType.startsWith('application/pdf')) {
    buffer = await compress(fileBuffer)
  }

  const fileId = await saveFile(fileBuffer)

  return NextResponse.json({ fileId, filename: originalName })
}
