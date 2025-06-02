import { db } from './db'
import { attachments } from './db/schema'
import { deleteFile, listFiles } from './storage'

/**
 * Deletes files from storage that are not referenced in the database (orphans).
 * Returns a list of deleted fileIds.
 */
export async function cleanupOrphanedFiles() {
  // Get all fileIds referenced in the database
  const dbFileIds: string[] = (
    await db.select({ fileId: attachments.fileId }).from(attachments)
  ).map((a) => a.fileId)
  const dbFileIdSet = new Set(dbFileIds)

  // Get all files in storage
  const storageFileIds = await listFiles()

  // Find files in storage that are not in the database
  const orphanedFileIds = storageFileIds.filter((fileId) => !dbFileIdSet.has(fileId))

  // Delete orphaned files
  for (const fileId of orphanedFileIds) {
    await deleteFile(fileId)
  }

  return orphanedFileIds
}
