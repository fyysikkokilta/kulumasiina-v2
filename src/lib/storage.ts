import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import { BucketItem, Client as MinioClient } from 'minio'
import path from 'path'

import { env } from './env'

const isS3 = env.STORAGE_DRIVER === 's3'

// S3 client setup
let minio: InstanceType<typeof MinioClient> | null = null
if (isS3) {
  minio = new MinioClient({
    endPoint: env.S3_ENDPOINT?.replace(/^https?:\/\//, '') || '',
    port: env.S3_ENDPOINT?.startsWith('https://') ? 443 : 80,
    useSSL: env.S3_ENDPOINT?.startsWith('https://') ?? true,
    accessKey: env.S3_ACCESS_KEY || '',
    secretKey: env.S3_SECRET_KEY || '',
    region: env.S3_REGION
  })
}

const bucket = env.S3_BUCKET || ''
const localPath = path.join(process.cwd(), 'data')

async function saveFileLocally(buffer: Buffer) {
  const filename = randomUUID()
  const filePath = path.join(localPath, filename)
  await fs.mkdir(localPath, { recursive: true })
  await fs.writeFile(filePath, buffer)
  return filename
}

async function saveFileToS3(buffer: Buffer) {
  if (!isS3 || !minio) throw new Error('S3 storage not enabled')
  const fileId = randomUUID()
  await minio.putObject(bucket, fileId, buffer, buffer.length)
  return fileId
}

export async function saveFile(buffer: Buffer) {
  if (isS3) {
    return await saveFileToS3(buffer)
  } else {
    return await saveFileLocally(buffer)
  }
}

async function getFileLocally(fileId: string) {
  const filePath = path.join(localPath, fileId)
  return await fs.readFile(filePath)
}

async function getFileFromS3(fileId: string) {
  if (!isS3 || !minio) throw new Error('S3 storage not enabled')
  const stream = await minio.getObject(bucket, fileId)
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks)
}

export async function getFile(fileId: string) {
  if (isS3) {
    return await getFileFromS3(fileId)
  } else {
    return await getFileLocally(fileId)
  }
}

export async function listFiles() {
  if (isS3) {
    const objects: BucketItem[] = []
    if (!minio) throw new Error('S3 storage not enabled')
    const objectsStream = minio.listObjectsV2(bucket, '', true)
    await new Promise((resolve, reject) => {
      objectsStream.on('data', (obj) => objects.push(obj))
      objectsStream.on('end', resolve)
      objectsStream.on('error', reject)
    })
    return objects
      .map((obj) => obj.name)
      .filter((name): name is string => name !== undefined)
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
    if (!minio) throw new Error('S3 storage not enabled')
    await minio.removeObjects(bucket, fileIds)
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
