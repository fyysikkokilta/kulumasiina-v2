'use client'

import { Select } from '@base-ui/react/select'
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import type { HookActionStatus } from 'next-safe-action/hooks'

import { bookkeepingAccounts } from '@/utils/bookkeeping-accounts'
import { inputClass } from '@/utils/form-styles'

export const accountSelectTriggerClass =
  'flex h-8 min-w-[200px] items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-1 text-xs ring-offset-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'

const defaultTriggerClass = `${inputClass} items-center justify-between`

export interface AccountSelectProps {
  /** Placeholder text when no value selected */
  placeholder: string
  /** Controlled value */
  value?: string
  /** Uncontrolled default value (for use in forms) */
  defaultValue?: string
  /** Called when value changes (use for controlled mode) */
  onChange?: (value: string) => void
  /** Whether the select is disabled */
  disabled?: boolean
  /** Whether the select is in a loading state (e.g. saving account outside form) */
  actionStatus?: HookActionStatus
  /** Trigger button className. Use accountSelectTriggerClass for compact table style. */
  triggerClassName?: string
  /** Item text size: 'sm' (text-xs, compact) or 'md' (text-sm, form default) */
  size?: 'sm' | 'md'
}

export function AccountSelect({
  placeholder,
  value,
  defaultValue,
  onChange,
  disabled = false,
  actionStatus = 'idle',
  triggerClassName = defaultTriggerClass,
  size = 'md'
}: AccountSelectProps) {
  const isControlled = value !== undefined
  const itemClass =
    size === 'sm'
      ? 'w-full cursor-pointer px-3 py-2 text-left text-xs data-highlighted:bg-gray-100 data-selected:bg-blue-50 data-selected:text-blue-600'
      : 'w-full cursor-pointer px-3 py-2 text-left text-sm data-highlighted:bg-gray-100 data-selected:bg-blue-50 data-selected:text-blue-600'
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const valuePlaceholderClass =
    size === 'sm' ? 'min-w-0 data-placeholder:text-gray-400' : 'min-w-0'
  const isExecuting = actionStatus === 'executing'
  const hasErrored = actionStatus === 'hasErrored'
  const triggerClass = [
    triggerClassName,
    hasErrored && 'border-2 border-red-500 ring-2 ring-red-500/30'
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Select.Root
      items={bookkeepingAccounts}
      value={isControlled ? value || null : undefined}
      defaultValue={!isControlled ? (defaultValue ?? undefined) : undefined}
      onValueChange={(v) => onChange?.(v ?? '')}
      disabled={disabled ?? isExecuting}
    >
      <Select.Trigger
        className={triggerClass}
        aria-invalid={hasErrored || undefined}
      >
        <Select.Value
          placeholder={placeholder}
          className={valuePlaceholderClass}
        />
        {isExecuting ? (
          <Loader2
            className={`shrink-0 animate-spin ${iconSize}`}
            aria-hidden
          />
        ) : hasErrored ? (
          <AlertCircle
            className={`shrink-0 text-red-600 ${iconSize}`}
            aria-label="Error"
          />
        ) : (
          <Select.Icon className="shrink-0">
            <ChevronDown className={iconSize} />
          </Select.Icon>
        )}
      </Select.Trigger>
      <Select.Portal
        container={typeof document !== 'undefined' ? document.body : null}
      >
        <Select.Positioner
          sideOffset={4}
          positionMethod="fixed"
          className="z-110"
        >
          <Select.Popup className="z-110 max-h-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
            <Select.List>
              {bookkeepingAccounts.map((account) => (
                <Select.Item
                  key={account.value}
                  value={account.value}
                  className={itemClass}
                >
                  <Select.ItemText>{account.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
}
