'use client'

import { Input } from '@base-ui/react/input'
import { Popover } from '@base-ui/react/popover'
import { ArrowRight, Filter } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'

export interface DateRangeValue {
  start?: string
  end?: string
}

interface DateFilterPopoverProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  startDateLabel: string
  endDateLabel: string
  okLabel: string
  resetLabel: string
  'aria-label'?: string
}

export function DateFilterPopover({
  value,
  onChange,
  startDateLabel,
  endDateLabel,
  okLabel,
  resetLabel,
  'aria-label': ariaLabel
}: DateFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<DateRangeValue>(value)
  const hasValue = Boolean(value.start || value.end)

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    setDraft(value)
  }

  const handleFilter = () => {
    onChange(draft)
    setOpen(false)
  }

  const handleReset = () => {
    const empty = {}
    setDraft(empty)
    onChange(empty)
    setOpen(false)
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        className="inline-flex cursor-pointer items-center rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:outline-none"
        aria-label={ariaLabel}
      >
        <Filter className={`h-4 w-4 ${hasValue ? 'text-blue-600' : ''}`} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6}>
          <Popover.Popup className="rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={draft.start ?? ''}
                  onValueChange={(v) => setDraft((prev) => ({ ...prev, start: v || undefined }))}
                  placeholder={startDateLabel}
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                  aria-label={startDateLabel}
                />
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                <Input
                  type="date"
                  value={draft.end ?? ''}
                  onValueChange={(v) => setDraft((prev) => ({ ...prev, end: v || undefined }))}
                  placeholder={endDateLabel}
                  className="rounded border border-gray-300 px-2 py-1.5 text-sm"
                  aria-label={endDateLabel}
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="small"
                  onClick={handleReset}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {resetLabel}
                </Button>
                <Button type="button" variant="primary" size="small" onClick={handleFilter}>
                  {okLabel}
                </Button>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
