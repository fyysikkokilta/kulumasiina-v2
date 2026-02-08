import type { ComponentPropsWithoutRef } from 'react'

export interface TagProps extends ComponentPropsWithoutRef<'span'> {
  color?: 'default' | 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gray'
}

const colorVariants = {
  default: 'bg-gray-100 text-gray-800 border-gray-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-300'
}

export function Tag({ className, color = 'default', children, ...props }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colorVariants[color]} ${className || ''}`}
      {...props}
    >
      {children}
    </span>
  )
}
