import type { FormEntry } from '@/lib/db/schema'
import type { FormItemWithAttachments, FormMileage } from '@/lib/db/schema'

export const isEntryItem = (entry: FormEntry | null): entry is FormItemWithAttachments => {
  return !!entry && 'attachments' in entry
}

export const isEntryMileage = (entry: FormEntry | null): entry is FormMileage => {
  return !!entry && 'distance' in entry
}
