export const getMimeType = (data: string) => {
  return data.split(';')[0].split(':')[1]
}

export const SUPPORTED_FILE_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

export const isSupportedFile = (mimeType: string) => {
  return SUPPORTED_FILE_MIME_TYPES.includes(mimeType)
}

export const isImage = (data: string) => {
  const mimeType = getMimeType(data)
  return mimeType.startsWith('image/')
}

export const getBase64Data = (base64: string) => {
  return base64.split(',')[1]
}
