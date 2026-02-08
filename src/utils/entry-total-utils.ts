import type { NewAttachment, NewMileage } from '@/lib/db/schema'
import { env } from '@/lib/env'

/**
 * Minimal shapes for calculating entry totals (items/mileages from admin or form).
 */
export type ItemLike = {
  attachments: Pick<NewAttachment, 'value' | 'isNotReceipt'>[]
}

export type MileageLike = Pick<NewMileage, 'distance'>

/** Sum of attachment values (excluding isNotReceipt) across items */
export function itemTotal(items: ItemLike[]) {
  return items.reduce((acc, item) => {
    return acc + item.attachments.reduce((sum, a) => sum + (a.isNotReceipt ? 0 : (a.value ?? 0)), 0)
  }, 0)
}

/** Sum of distance × rate across mileages */
export function mileageTotal(mileages: MileageLike[]) {
  const mileageRate = env.NEXT_PUBLIC_MILEAGE_REIMBURSEMENT_RATE
  return mileages.reduce((acc, m) => acc + m.distance * mileageRate, 0)
}

/** Total for an array of form entries (item or mileage per entry) */
export function calculateFormEntriesTotal(items: ItemLike[], mileages: MileageLike[]) {
  const itemTotalValue = itemTotal(items)
  const mileageTotalValue = mileageTotal(mileages)
  return itemTotalValue + mileageTotalValue
}
