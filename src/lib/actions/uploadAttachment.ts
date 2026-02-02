'use server'

import { compress } from 'compress-pdf'
import sharp from 'sharp'
import { z } from 'zod'

import { saveFile } from '@/lib/storage'

import { actionClient } from './safeActionClient'

const UploadAttachmentSchema = z.object({
  file: z.instanceof(File),
  mimeType: z.string()
})

export const uploadAttachmentAction = actionClient
  .inputSchema(UploadAttachmentSchema)
  .action(async ({ parsedInput: { file, mimeType } }) => {
    // Decode base64 to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    let buffer: Buffer

    // If image, compress/resize with sharp
    if (mimeType.startsWith('image/')) {
      try {
        const image = sharp(fileBuffer)
        const metadata = await image.metadata()
        const isWiderThanTall = (metadata.width || 0) > (metadata.height || 0)

        buffer = await image
          .rotate()
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
        throw new Error('Failed to compress image')
      }
    }
    // If pdf, compress with compress-pdf
    else if (mimeType.startsWith('application/pdf')) {
      buffer = await compress(fileBuffer)
    } else {
      throw new Error('Invalid file type')
    }

    const fileId = await saveFile(buffer)

    return { fileId, filename: file.name }
  })
