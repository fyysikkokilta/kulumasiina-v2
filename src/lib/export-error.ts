/**
 * Structured error payload returned by export API routes on failure.
 * Success responses remain binary downloads (PDF/CSV/ZIP).
 */
export interface ExportErrorPayload {
  code: ExportErrorCode
  message: string
  entryId?: string
  attachmentId?: string
  fileId?: string | null
  filename?: string | null
  missingEntryIds?: string[]
}

/** Machine-readable error codes for export API failures. */
export type ExportErrorCode =
  | 'ATTACHMENT_STORAGE_ERROR'
  | 'ENTRY_NOT_FOUND'
  | 'SOME_ENTRIES_NOT_FOUND'
  | 'INVALID_ENTRY_STATUS'
  | 'INVALID_ENTRY_IDS'
  | 'INVALID_API_URL'
  | 'UNAUTHORIZED'
  | 'MISSING_ENTRY_IDS'
  | 'INTERNAL_ERROR'

/** Creates a structured error payload from an AttachmentStorageError. */
export function attachmentStorageErrorPayload(
  entryId: string,
  attachmentId: string,
  fileId: string | null,
  filename: string | null
): ExportErrorPayload {
  return {
    code: 'ATTACHMENT_STORAGE_ERROR',
    message: 'Attachment file is missing or unreadable.',
    entryId,
    attachmentId,
    fileId,
    filename
  }
}

/** Creates a structured error payload for a not-found entry. */
export function entryNotFoundErrorPayload(entryId: string): ExportErrorPayload {
  return {
    code: 'ENTRY_NOT_FOUND',
    message: 'Entry not found.',
    entryId
  }
}

/** Creates a structured error payload for missing entries in bulk export. */
export function someEntriesNotFoundErrorPayload(missingEntryIds: string[]): ExportErrorPayload {
  return {
    code: 'SOME_ENTRIES_NOT_FOUND',
    message: 'Some entries were not found.',
    missingEntryIds
  }
}

/** Creates a structured error payload for invalid entry status. */
export function invalidEntryStatusErrorPayload(
  entryId: string,
  status: string
): ExportErrorPayload {
  return {
    code: 'INVALID_ENTRY_STATUS',
    message: `Entry status '${status}' is invalid for this export operation.`,
    entryId
  }
}
