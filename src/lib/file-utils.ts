export const getMimeType = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return 'application/pdf'
    case 'jpg':
      return 'image/jpeg'
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}

export const supportedFileMimeTypes = ['application/pdf', 'image/jpeg', 'image/png']

export const isSupportedFile = (filename: string) => {
  const mimeType = getMimeType(filename)
  return supportedFileMimeTypes.includes(mimeType)
}

export const isImage = (filename: string) => {
  const mimeType = getMimeType(filename)
  return mimeType.startsWith('image/')
}

export const getFileExtension = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension || ''
}

export const getBase64Data = (base64: string) => {
  return base64.split(',')[1]
}
