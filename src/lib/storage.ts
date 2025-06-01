import fs from 'fs/promises'
import { Client as MinioClient } from 'minio'
import path from 'path'

import { env } from './env'

const isS3 = env.NEXT_PUBLIC_STORAGE_DRIVER === 's3'

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

async function saveFileLocally(filename: string, buffer: Buffer) {
  const filePath = path.join(localPath, filename)
  await fs.mkdir(localPath, { recursive: true })
  await fs.writeFile(filePath, buffer)
}

async function saveFileToS3(fileId: string, buffer: Buffer) {
  if (!isS3 || !minio) throw new Error('S3 storage not enabled')
  await minio.putObject(bucket, fileId, buffer, buffer.length)
}

export async function saveFile(fileId: string, buffer: Buffer) {
  if (isS3) {
    return await saveFileToS3(fileId, buffer)
  } else {
    return await saveFileLocally(fileId, buffer)
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
