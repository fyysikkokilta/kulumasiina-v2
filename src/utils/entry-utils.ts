import type { FormItemWithAttachments, FormMileage, FormEntry } from '@/db/types'

export const isEntryItem = (entry: FormEntry | null): entry is FormItemWithAttachments => {
  return !!entry && 'attachments' in entry
}

export const isEntryMileage = (entry: FormEntry | null): entry is FormMileage => {
  return !!entry && 'distance' in entry
}
