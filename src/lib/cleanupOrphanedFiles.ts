import { db } from '@/db'
import { attachment } from '@/db/schema'
import { deleteFiles, listFiles } from './storage'

/**
 * Deletes files from storage that are not referenced in the database (orphans).
 * Returns a list of deleted fileIds.
 */
export async function cleanupOrphanedFiles() {
  // Get all fileIds referenced in the database
  const dbFileIds: string[] = (await db.select({ fileId: attachment.fileId }).from(attachment)).map(
    (a) => a.fileId
  )
  const dbFileIdSet = new Set(dbFileIds)

  // Get all files in storage
  const storageFileIds = await listFiles()

  // Find files in storage that are not in the database
  const orphanedFileIds = storageFileIds.filter((fileId) => !dbFileIdSet.has(fileId))

  // Delete orphaned files
  await deleteFiles(orphanedFileIds)

  return orphanedFileIds
}
