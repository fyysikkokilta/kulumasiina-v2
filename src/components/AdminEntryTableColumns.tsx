'use client'

import { Checkbox } from '@base-ui/react/checkbox'
import { createColumnHelper } from '@tanstack/react-table'
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Minus,
  RotateCcw
} from 'lucide-react'

import {
  DateFilterPopover,
  type DateRangeValue
} from '@/components/admin/DateFilterPopover'
import { MultiSelectFilterPopover } from '@/components/admin/MultiSelectFilterPopover'
import { Button } from '@/components/ui/Button'
import { Tag } from '@/components/ui/Tag'
import type { AdminEntries } from '@/data/getAdminEntries'
import { STATUS_COLORS } from '@/utils/admin-entry-utils'

export type EntryRow = AdminEntries[number] & { key: string; total: number }

const columnHelper = createColumnHelper<EntryRow>()

const STATUS_VALUES = Object.keys(
  STATUS_COLORS
) as (keyof typeof STATUS_COLORS)[]

export interface AdminEntryTableColumnsParams {
  t: ReturnType<typeof import('next-intl').useTranslations<'AdminEntryTable'>>
  toggleExpand: (id: string) => void
  expandedIds: Record<string, boolean>
  getStatusColor: (status: keyof typeof STATUS_COLORS) => string
  getStatusText: (status: keyof typeof STATUS_COLORS) => string
  uniqueNames: string[]
  hasFiltersOrSorting: boolean
  onClearFilters: () => void
}

export function getAdminEntryTableColumns({
  t,
  toggleExpand,
  expandedIds,
  getStatusColor,
  getStatusText,
  uniqueNames,
  hasFiltersOrSorting,
  onClearFilters
}: AdminEntryTableColumnsParams) {
  return [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => {
        const isIndeterminate =
          table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
        return (
          <Checkbox.Root
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={isIndeterminate}
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(!!checked)
            }
            className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none"
            aria-label={t('filter.filter')}
          >
            <Checkbox.Indicator
              keepMounted
              className="flex size-full items-center justify-center data-checked:opacity-100 data-indeterminate:opacity-100 data-unchecked:opacity-0"
            >
              {isIndeterminate ? (
                <Minus className="h-3 w-3 text-blue-600" aria-hidden />
              ) : (
                <Check className="h-3 w-3 text-blue-600" aria-hidden />
              )}
            </Checkbox.Indicator>
          </Checkbox.Root>
        )
      },
      cell: ({ row }) => (
        <Checkbox.Root
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onCheckedChange={(checked) => row.toggleSelected(!!checked)}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none disabled:bg-gray-100 disabled:opacity-50"
          aria-label={t('table.name')}
        >
          <Checkbox.Indicator
            keepMounted
            className="flex size-full items-center justify-center data-checked:opacity-100 data-unchecked:opacity-0"
          >
            <Check className="h-3 w-3 text-blue-600" aria-hidden />
          </Checkbox.Indicator>
        </Checkbox.Root>
      ),
      size: 48
    }),
    columnHelper.display({
      id: 'expand',
      header: () =>
        hasFiltersOrSorting ? (
          <Button
            variant="ghost"
            size="small"
            type="button"
            onClick={onClearFilters}
            className="m-0 rounded"
            aria-label={t('filter.reset')}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : null,
      cell: ({ row }) => {
        const isExpanded = !!expandedIds[row.original.id]
        return (
          <Button
            type="button"
            variant="ghost"
            size="small"
            className="rounded p-0.5 text-blue-600 hover:text-blue-800"
            onClick={() => toggleExpand(row.original.id)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        )
      },
      size: 48
    }),
    columnHelper.accessor('submissionDate', {
      id: 'submissionDate',
      header: ({ column }) => {
        const filterValue =
          (column.getFilterValue() as DateRangeValue | undefined) ?? {}
        return (
          <div className="flex items-center gap-1">
            <DateFilterPopover
              value={filterValue}
              onChange={(v) => column.setFilterValue(v)}
              startDateLabel={t('filter.start_date')}
              endDateLabel={t('filter.end_date')}
              okLabel={t('filter.ok')}
              resetLabel={t('filter.reset')}
              aria-label={t('filter.filter')}
            />
            <span className="select-none">{t('table.date')}</span>
            <Button
              type="button"
              variant="ghost"
              size="small"
              className="rounded p-0.5 text-blue-600 hover:bg-gray-100 hover:text-blue-800"
              onClick={column.getToggleSortingHandler()}
              aria-label={t('filter.filter')}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        )
      },
      cell: (info) => new Date(info.getValue()).toLocaleDateString('fi-FI'),
      size: 120,
      enableSorting: true,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue: DateRangeValue) => {
        if (!filterValue?.start && !filterValue?.end) return true
        const rowDate = new Date(row.getValue('submissionDate')).getTime()
        if (filterValue.start) {
          const start = new Date(filterValue.start).getTime()
          if (rowDate < start) return false
        }
        if (filterValue.end) {
          const end = new Date(filterValue.end).setHours(23, 59, 59, 999)
          if (rowDate > end) return false
        }
        return true
      }
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => {
        const filterValue = column.getFilterValue() as string[]
        return (
          <div className="flex items-center gap-1">
            <MultiSelectFilterPopover
              value={filterValue}
              onChange={(v) => column.setFilterValue(v)}
              options={uniqueNames.map((n) => ({ value: n, label: n }))}
              searchPlaceholder={t('filter.search_in_filters')}
              showSearch
              resetLabel={t('filter.reset')}
              okLabel={t('filter.ok')}
              aria-label={t('filter.filter')}
              emptyListMessage={t('filter.no_names_found')}
            />
            <span className="select-none">{t('table.name')}</span>
          </div>
        )
      },
      cell: (info) => (
        <div className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">
          {info.getValue()}
        </div>
      ),
      size: 180,
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue: string[]) => {
        if (filterValue.length === 0) return true
        return filterValue.includes(String(row.getValue('name')))
      }
    }),
    columnHelper.accessor('title', {
      header: () => t('table.title'),
      cell: (info) => (
        <div className="max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
          {info.getValue().length > 25
            ? info.getValue().slice(0, 25) + '...'
            : info.getValue()}
        </div>
      ),
      size: 220,
      enableSorting: false,
      enableColumnFilter: false
    }),
    columnHelper.accessor('total', {
      header: () => t('table.total'),
      cell: (info) => `${info.getValue().toFixed(2)} €`,
      size: 110,
      enableSorting: false,
      enableColumnFilter: false
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => {
        const filterValue = column.getFilterValue() as string[]
        return (
          <div className="flex items-center gap-1">
            <MultiSelectFilterPopover
              value={filterValue}
              onChange={(v) => column.setFilterValue(v)}
              options={STATUS_VALUES.map((v) => ({
                value: v,
                label: t(`filter.${v}`)
              }))}
              showSearch={false}
              resetLabel={t('filter.reset')}
              okLabel={t('filter.ok')}
              aria-label={t('filter.filter')}
            />
            <span className="select-none">{t('table.status')}</span>
          </div>
        )
      },
      cell: (info) => (
        <Tag
          color={
            getStatusColor(info.getValue()) as
              | 'default'
              | 'blue'
              | 'green'
              | 'red'
              | 'purple'
              | 'orange'
              | 'gray'
          }
        >
          {getStatusText(info.getValue())}
        </Tag>
      ),
      size: 120,
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue: string[]) => {
        if (filterValue.length === 0) return true
        return filterValue.includes(row.getValue('status'))
      }
    }),
    columnHelper.accessor((row) => (row.archived ? 'archived' : 'active'), {
      id: 'archived',
      header: ({ column }) => {
        const filterValue = column.getFilterValue() as string[]
        return (
          <div className="flex items-center gap-1">
            <MultiSelectFilterPopover
              value={filterValue}
              onChange={(v) => column.setFilterValue(v)}
              options={[
                { value: 'active', label: t('filter.active') },
                { value: 'archived', label: t('filter.archived') }
              ]}
              showSearch={false}
              resetLabel={t('filter.reset')}
              okLabel={t('filter.ok')}
              aria-label={t('filter.filter')}
            />
            <span className="select-none">{t('table.archived')}</span>
          </div>
        )
      },
      cell: (info) => (
        <Tag color={info.getValue() === 'archived' ? 'gray' : 'green'}>
          {info.getValue() === 'archived'
            ? t('status.archived')
            : t('status.active')}
        </Tag>
      ),
      size: 110,
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _columnId, filterValue: string[]) => {
        if (filterValue.length === 0) return true
        return filterValue.includes(row.getValue('archived'))
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: () => t('table.actions'),
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="small"
            onClick={() => window.open(`/api/entry/${row.original.id}/pdf`)}
          >
            {t('actions.pdf')}
          </Button>
          {(row.original.status === 'paid' ||
            row.original.status === 'approved') && (
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => window.open(`/api/entry/${row.original.id}/csv`)}
            >
              {row.original.status === 'paid'
                ? t('actions.zip')
                : t('actions.csv')}
            </Button>
          )}
        </div>
      ),
      size: 140
    })
  ]
}
