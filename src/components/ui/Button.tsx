'use client'

import { Button as BaseButton } from '@base-ui/react/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { HookActionStatus } from 'next-safe-action/hooks'
import { ComponentPropsWithoutRef, forwardRef } from 'react'

const baseClasses =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50'

const variantClasses = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary:
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
  ghost: 'text-gray-700 hover:bg-gray-100'
} as const

const sizeClasses = {
  default: 'px-4 py-2 text-sm',
  small: 'px-3 py-1.5 text-xs'
} as const

export interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<typeof BaseButton>,
  'className'
> {
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
  /** Action status from useAction (or similar). Drives loading spinner and error state. */
  actionStatus?: HookActionStatus
  className?: string
}

const isPending = (s: HookActionStatus | undefined) =>
  s === 'executing' || s === 'transitioning'
const hasError = (s: HookActionStatus | undefined) => s === 'hasErrored'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'default',
      actionStatus,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const pending = isPending(actionStatus)
    const error = hasError(actionStatus)
    const mergedClass = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      error && 'border-2 border-red-500 ring-2 ring-red-500/30',
      className
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <BaseButton
        ref={ref}
        className={mergedClass}
        disabled={disabled ?? pending}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {pending && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        )}
        {error && !pending && (
          <AlertCircle
            className="h-4 w-4 shrink-0 text-red-600"
            aria-label="Error"
          />
        )}
        {children}
      </BaseButton>
    )
  }
)
Button.displayName = 'Button'
