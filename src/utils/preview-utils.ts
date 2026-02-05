export type PreviewState = Promise<{
  url: string
  title: string
  isImage: boolean
  isNotReceipt: boolean
  value: number | null
}>

export interface PrepareAttachmentPreviewParams {
  fileId: string
  filename: string
  isNotReceipt: boolean
  value: number | null
  fetchOptions?: RequestInit
}

/**
 * Fetches an attachment and returns PreviewState for opening the preview modal.
 * Caller should pass the result to setPreviewState.
 */
export async function prepareAttachmentPreview({
  fileId,
  filename,
  isNotReceipt,
  value,
  fetchOptions
}: PrepareAttachmentPreviewParams) {
  const res = await fetch(`/api/attachment/${fileId}`, fetchOptions)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const mimeType = res.headers.get('content-type')
  return {
    url,
    title: filename,
    isImage: mimeType?.startsWith('image/') ?? false,
    isNotReceipt,
    value
  }
}
