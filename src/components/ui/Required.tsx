export function Required({ className }: { className?: string }) {
  return (
    <span className={className ?? 'text-red-500'} aria-hidden>
      {' *'}
    </span>
  )
}
