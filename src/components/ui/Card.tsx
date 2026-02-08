import type { ComponentPropsWithoutRef, ReactNode } from 'react'

export interface CardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'title'> {
  size?: 'default' | 'small'
  title?: ReactNode
}

export function Card({ className, size = 'default', title, children, ...props }: CardProps) {
  const padding = size === 'small' ? 'p-3' : 'p-4'

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${padding} ${className || ''}`}
      {...props}
    >
      {title && <div className="mb-3 border-b border-gray-200 pb-2 font-semibold">{title}</div>}
      {children}
    </div>
  )
}
