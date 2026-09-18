import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import { S3mini } from 's3mini'
import path from 'path'

import { env } from './env'

const isS3 =
  env.STORAGE_DRIVER === 's3' && env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY

// S3 client setup
let s3mini: InstanceType<typeof S3mini> | null = null
if (isS3) {
  s3mini = new S3mini({
    endpoint: env.S3_ENDPOINT!,
    accessKeyId: env.S3_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    region: env.S3_REGION
  })
}

const localPath = path.join(process.cwd(), 'data')

async function saveFileLocally(buffer: Buffer) {
  const filename = randomUUID()
  const filePath = path.join(localPath, filename)
  await fs.mkdir(localPath, { recursive: true })
  await fs.writeFile(filePath, buffer)
  return filename
}

// Uploads to the S3 endpoint occasionally fail on a dropped connection
// (UND_ERR_SOCKET "other side closed"). s3mini does not retry those, so without
// this a single blip surfaces to the user as a failed attachment upload.
const S3_UPLOAD_ATTEMPTS = 3

async function saveFileToS3(buffer: Buffer) {
  if (!isS3 || !s3mini) throw new Error('S3 storage not configured')
  const fileId = randomUUID()
  // The key is fixed for the whole call, so a retry just overwrites whatever a
  // previous attempt may have left behind.
  for (let attempt = 1; ; attempt++) {
    try {
      await s3mini.putObject(fileId, buffer, undefined, undefined, undefined, buffer.length)
      return fileId
    } catch (e) {
      if (attempt === S3_UPLOAD_ATTEMPTS) {
        console.error(`Failed to upload file to S3 after ${attempt} attempts`, e)
        throw e
      }
      console.warn(`S3 upload attempt ${attempt} failed, retrying`, e)
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** (attempt - 1)))
    }
  }
}

export async function saveFile(buffer: Buffer) {
  if (isS3) {
    return saveFileToS3(buffer)
  } else {
    return saveFileLocally(buffer)
  }
}

async function getFileLocally(fileId: string) {
  const filePath = path.join(localPath, fileId)
  const content = await fs.readFile(filePath)
  return content ? Buffer.from(content) : null
}

async function getFileFromS3(fileId: string) {
  if (!isS3 || !s3mini) throw new Error('S3 storage not configured')
  const content = await s3mini.getObjectArrayBuffer(fileId)
  return content ? Buffer.from(content) : null
}

export async function getFile(fileId: string) {
  if (isS3) {
    return getFileFromS3(fileId)
  } else {
    return getFileLocally(fileId)
  }
}

export async function listFiles() {
  if (isS3) {
    if (!s3mini) throw new Error('S3 storage not configured')
    const objects = await s3mini.listObjects()
    return objects?.map((obj) => obj.Key) ?? []
  } else {
    try {
      await fs.mkdir(localPath, { recursive: true })
      const files = await fs.readdir(localPath)
      return files
    } catch (e) {
      console.log('Error listing files from local', e)
      return []
    }
  }
}

export async function deleteFiles(fileIds: string[]) {
  if (isS3) {
    if (!s3mini) throw new Error('S3 storage not configured')
    await s3mini.deleteObjects(fileIds)
    console.log('Deleted files from S3', fileIds)
  } else {
    for (const fileId of fileIds) {
      const filePath = path.join(localPath, fileId)
      try {
        await fs.unlink(filePath)
      } catch (e) {
        console.log('Error deleting file from local', e)
        // Ignore if file does not exist
      }
    }
    console.log('Deleted files from local', fileIds)
  }
}
