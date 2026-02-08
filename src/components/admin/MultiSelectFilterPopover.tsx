'use client'

import { Checkbox } from '@base-ui/react/checkbox'
import { Input } from '@base-ui/react/input'
import { Popover } from '@base-ui/react/popover'
import { Check, Filter, Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/Button'

export interface MultiSelectFilterOption {
  value: string
  label: string
}

interface MultiSelectFilterPopoverProps {
  value: string[]
  onChange: (value: string[]) => void
  options: MultiSelectFilterOption[]
  searchPlaceholder?: string
  resetLabel: string
  okLabel: string
  /** When false, the search field is hidden (e.g. for status/archived filters). */
  showSearch?: boolean
  emptyListMessage?: string
  'aria-label'?: string
}

export function MultiSelectFilterPopover({
  value,
  onChange,
  options,
  searchPlaceholder = '',
  resetLabel,
  okLabel,
  showSearch = true,
  emptyListMessage = '',
  'aria-label': ariaLabel
}: MultiSelectFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Set<string>>(() => new Set(value))
  const [search, setSearch] = useState('')
  const hasValue = value.length > 0

  const filteredOptions = (() => {
    if (!showSearch || !search.trim()) return options
    const q = search.toLowerCase()
    return options.filter(
      (opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q)
    )
  })()

  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    setDraft(new Set(value))
  }

  const toggle = (optionValue: string) => {
    setDraft((prev) => {
      const next = new Set(prev)
      if (next.has(optionValue)) next.delete(optionValue)
      else next.add(optionValue)
      return next
    })
  }

  const handleReset = () => {
    setDraft(new Set())
    onChange([])
    setOpen(false)
  }

  const handleOk = () => {
    onChange(Array.from(draft))
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
          <Popover.Popup
            className={`flex flex-col rounded-lg border border-gray-200 bg-white shadow-lg ${showSearch ? 'w-64' : 'w-auto min-w-40'}`}
          >
            {showSearch && (
              <div className="relative border-b border-gray-200 p-2">
                <Search
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={search}
                  onValueChange={setSearch}
                  placeholder={searchPlaceholder}
                  className="w-full rounded border border-gray-300 py-1.5 pr-2 pl-9 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  aria-label={searchPlaceholder}
                />
              </div>
            )}
            <div className="max-h-56 overflow-y-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">
                  {showSearch && search ? emptyListMessage : 'No options'}
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {filteredOptions.map((opt) => (
                    <li key={opt.value}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                        <Checkbox.Root
                          checked={draft.has(opt.value)}
                          onCheckedChange={() => toggle(opt.value)}
                          className="h-4 w-4 shrink-0 rounded border border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
                          aria-label={opt.label}
                        >
                          <Checkbox.Indicator
                            keepMounted
                            className="flex size-full items-center justify-center data-checked:opacity-100 data-unchecked:opacity-0"
                          >
                            <Check className="h-3 w-3 text-blue-600" aria-hidden />
                          </Checkbox.Indicator>
                        </Checkbox.Root>
                        <span className="truncate text-sm">{opt.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
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
              <Button type="button" variant="primary" size="small" onClick={handleOk}>
                {okLabel}
              </Button>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
