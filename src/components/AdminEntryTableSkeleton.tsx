const SKELETON_COLUMNS = [
  { width: 'w-8' }, // select
  { width: 'w-8' }, // expand
  { width: 'w-28' }, // submission date
  { width: 'w-36' }, // name
  { width: 'w-48' }, // title
  { width: 'w-20' }, // total
  { width: 'w-24' }, // status
  { width: 'w-20' }, // archived
  { width: 'w-32' } // actions
]

const SKELETON_ROW_COUNT = 10

function SkeletonCell({ width }: { width: string }) {
  return (
    <td className="border-b border-gray-100 px-3 py-2">
      <div className={`h-4 rounded bg-gray-200 ${width} animate-pulse`} aria-hidden />
    </td>
  )
}

function SkeletonHeaderCell({ width }: { width: string }) {
  return (
    <th
      className="border-b border-gray-200 px-3 py-2 text-left text-xs font-medium tracking-wider text-gray-600"
      style={{ width: 'auto' }}
    >
      <div className={`h-3 rounded bg-gray-200 ${width} animate-pulse`} aria-hidden />
    </th>
  )
}

export function AdminEntryTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex min-h-12 items-center justify-between gap-4">
        <div className="h-9 w-48 animate-pulse rounded bg-gray-200" aria-hidden />
        <div className="flex gap-2">
          <div className="h-8 w-24 animate-pulse rounded bg-gray-200" aria-hidden />
          <div className="h-8 w-20 animate-pulse rounded bg-gray-200" aria-hidden />
        </div>
      </div>

      <div className="overflow-x-auto rounded bg-white p-1.5 shadow" style={{ minWidth: '900px' }}>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {SKELETON_COLUMNS.map((col, i) => (
                <SkeletonHeaderCell key={i} width={col.width} />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => (
              <tr key={i} className="hover:bg-gray-50/50">
                {SKELETON_COLUMNS.map((col, j) => (
                  <SkeletonCell key={j} width={col.width} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" aria-hidden />
          <div className="flex items-center gap-2">
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" aria-hidden />
            <div className="h-8 w-20 animate-pulse rounded bg-gray-200" aria-hidden />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" aria-hidden />
            <div className="h-8 w-16 animate-pulse rounded bg-gray-200" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  )
}
