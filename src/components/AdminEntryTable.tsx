'use client'

import { Select } from '@base-ui/react/select'
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAction } from 'next-safe-action/hooks'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'

import type { EditState } from '@/components/AdminEntryModals'
import { Tag } from '@/components/ui/Tag'
import type { AdminEntries } from '@/data/getAdminEntries'
import { archiveEntriesAction } from '@/lib/actions/archiveEntries'
import { denyEntriesAction } from '@/lib/actions/denyEntries'
import { resetEntriesAction } from '@/lib/actions/resetEntries'
import { updateItemAction } from '@/lib/actions/updateItem'
import { updateMileageAction } from '@/lib/actions/updateMileage'
import type { FormItemWithAttachments, FormMileage } from '@/lib/db/schema'
import {
  formatEntryForClipboard,
  isOldArchived,
  PAGE_SIZES,
  STATUS_COLORS
} from '@/utils/admin-entry-utils'
import { calculateFormEntriesTotal } from '@/utils/entry-total-utils'
import { type PreviewState } from '@/utils/preview-utils'

import { AdminEntryExpandedRow } from './AdminEntryExpandedRow'
import { AdminEntryModals } from './AdminEntryModals'
import {
  type EntryRow,
  getAdminEntryTableColumns
} from './AdminEntryTableColumns'
import { Button } from './ui/Button'

const DEFAULT_COLUMN_FILTERS = [
  { id: 'submissionDate', value: {} as { start?: string; end?: string } },
  { id: 'name', value: [] as string[] },
  { id: 'status', value: [] as string[] },
  { id: 'archived', value: ['active'] as string[] }
]

const DEFAULT_SORTING = [{ id: 'submissionDate', desc: true }]

export function AdminEntryTable({ entries }: { entries: AdminEntries }) {
  const t = useTranslations('AdminEntryTable')

  const [columnFilters, setColumnFilters] = useState<
    { id: string; value: unknown }[]
  >(DEFAULT_COLUMN_FILTERS)
  const [sorting, setSorting] =
    useState<{ id: string; desc: boolean }[]>(DEFAULT_SORTING)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [payModalVisible, setPayModalVisible] = useState(false)
  const [deleteOldArchivedModalVisible, setDeleteOldArchivedModalVisible] =
    useState(false)
  const [modalEntryIds, setModalEntryIds] = useState<string[]>([])
  const [editState, setEditState] = useState<EditState | null>(null)
  const [previewState, setPreviewState] = useState<PreviewState | null>(null)

  const { execute: denyEntries, status: denyStatus } = useAction(
    denyEntriesAction,
    {
      onSuccess: () => setSelectedRowKeys([]),
      onError: () => {}
    }
  )
  const { execute: archiveEntries, status: archiveStatus } = useAction(
    archiveEntriesAction,
    {
      onSuccess: () => setSelectedRowKeys([]),
      onError: () => {}
    }
  )
  const { execute: resetEntries, status: resetStatus } = useAction(
    resetEntriesAction,
    {
      onSuccess: () => setSelectedRowKeys([]),
      onError: () => {}
    }
  )
  const { execute: updateItem, status: updateItemStatus } = useAction(
    updateItemAction,
    {
      onSuccess: () => setEditState(null),
      onError: () => {}
    }
  )
  const { execute: updateMileage, status: updateMileageStatus } = useAction(
    updateMileageAction,
    {
      onSuccess: () => setEditState(null),
      onError: () => {}
    }
  )

  const tableData = useMemo(
    () =>
      entries.map((entry) => ({
        ...entry,
        key: entry.id,
        total: calculateFormEntriesTotal(entry.items, entry.mileages)
      })),
    [entries]
  )
  const toBeDeleted = useMemo(
    () => entries.filter(isOldArchived).length,
    [entries]
  )

  const getStatusColor = useCallback(
    (status: string) => STATUS_COLORS[status] ?? 'default',
    []
  )
  const getStatusText = useCallback(
    (status: string) =>
      status ? t(`status.${status}` as 'status.submitted') : '',
    [t]
  )
  const getTargetIds = (ids?: string[]) =>
    ids ?? selectedRowKeys.map((k) => String(k))

  const handleItemUpdate = (itemData: FormItemWithAttachments) => {
    if (!editState?.data) return
    updateItem({
      id: editState.data.id,
      ...itemData
    })
  }
  const handleMileageUpdate = (mileageData: FormMileage) => {
    if (!editState?.data) return
    updateMileage({
      id: editState.data.id,
      ...mileageData
    })
  }
  const closePreview = () => setPreviewState(null)
  const handleApprove = (ids?: string[]) => {
    setModalEntryIds(getTargetIds(ids))
    setApproveModalVisible(true)
  }
  const handleDeny = (ids?: string[]) => denyEntries({ ids: getTargetIds(ids) })
  const handlePay = (ids?: string[]) => {
    setModalEntryIds(getTargetIds(ids))
    setPayModalVisible(true)
  }
  const handleArchive = (ids?: string[]) =>
    archiveEntries({ ids: getTargetIds(ids) })
  const handleReset = (ids?: string[]) =>
    resetEntries({ ids: getTargetIds(ids) })
  const handleMultiZipDownload = () => {
    const ids = selectedRowKeys.map((k) => String(k))
    window.open(`/api/entry/multi/zip?entry_ids=${ids.join(',')}`)
  }
  const handleCopyClipboardText = () => {
    const lines = tableData
      .filter((e) => selectedRowKeys.includes(e.id))
      .map((entry) => formatEntryForClipboard(entry))
    void navigator.clipboard.writeText(lines.join('\n'))
  }

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }, [columnFilters])

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const rowSelectionState = useMemo(
    () => Object.fromEntries(selectedRowKeys.map((k) => [k, true])),
    [selectedRowKeys]
  )

  const uniqueNames = useMemo(
    () => [...new Set(tableData.map((e) => e.name))].sort(),
    [tableData]
  )

  const columns = useMemo(
    () =>
      getAdminEntryTableColumns({
        t,
        toggleExpand,
        expandedIds,
        getStatusColor,
        getStatusText,
        uniqueNames
      }),
    [t, toggleExpand, expandedIds, getStatusColor, getStatusText, uniqueNames]
  )

  const table = useReactTable({
    data: tableData,
    columns: columns as ColumnDef<EntryRow>[],
    getRowId: (row) => row.id,
    state: {
      columnFilters,
      sorting,
      pagination,
      rowSelection: rowSelectionState
    },
    onColumnFiltersChange: (updater) => setColumnFilters(updater),
    onSortingChange: (updater) => setSorting(updater),
    onPaginationChange: (updater) => setPagination(updater),
    onRowSelectionChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(rowSelectionState) : updater
      setSelectedRowKeys(Object.keys(next).filter((k) => next[k]))
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: (row) => {
      if (selectedRowKeys.length === 0) return true
      const statuses = [
        ...new Set(
          tableData
            .filter((e) => selectedRowKeys.includes(e.key))
            .map((e) => e.status)
        )
      ]
      return statuses.includes(row.original.status)
    }
  })

  const selectedEntries = tableData.filter((e) =>
    selectedRowKeys.includes(e.key)
  )
  const selectedStatuses = [...new Set(selectedEntries.map((e) => e.status))]
  const selectedStatus =
    selectedStatuses.length === 1 ? selectedStatuses[0] : null
  const allSelectedPaid = selectedStatus === 'paid'
  const allSelectedSubmitted = selectedStatus === 'submitted'
  const allSelectedApproved = selectedStatus === 'approved'
  const allSelectedDenied = selectedStatus === 'denied'
  const noneArchived = selectedEntries.every((e) => !e.archived)
  const allSelectedSameStatus = selectedStatuses.length === 1

  const pageRows = table.getRowModel().rows
  const totalRows = table.getSortedRowModel().rows.length
  const pageCount = table.getPageCount()
  const safePage = pagination.pageIndex
  const start = safePage * pagination.pageSize

  const hasFilters = columnFilters.some((f) => {
    if (f.id === 'submissionDate') {
      const v = f.value as { start?: string; end?: string }
      return Boolean(v?.start || v?.end)
    }
    if (f.id === 'name') return (f.value as string[]).length > 0
    if (f.id === 'status') return (f.value as string[]).length > 0
    if (f.id === 'archived')
      return (
        (f.value as string[]).length !== 1 ||
        (f.value as string[])[0] !== 'active'
      )
  })

  const hasSorting = sorting.some(
    (s) => s.id !== 'submissionDate' || s.desc !== true
  )

  const clearFilters = () => {
    setSorting(DEFAULT_SORTING)
    setColumnFilters(DEFAULT_COLUMN_FILTERS)
  }

  return (
    <>
      <AdminEntryModals
        modals={{
          approveModalVisible,
          setApproveModalVisible,
          payModalVisible,
          setPayModalVisible,
          deleteOldArchivedModalVisible,
          setDeleteOldArchivedModalVisible,
          modalEntryIds,
          setSelectedRowKeys,
          editState,
          setEditState,
          handleItemUpdate,
          handleMileageUpdate,
          updateItemStatus,
          updateMileageStatus,
          previewState,
          closePreview
        }}
      />
      <div className="space-y-4">
        <div className="flex min-h-12 items-center gap-4">
          <div className="w-24 shrink-0">
            {(hasFilters || hasSorting) && (
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={clearFilters}
              >
                {t('filter.reset')}
              </Button>
            )}
          </div>
          <div className="flex min-h-10 min-w-0 flex-1 items-center gap-4">
            {selectedRowKeys.length > 0 && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
                <span>
                  <strong>{selectedRowKeys.length}</strong>{' '}
                  {t('selection.entries_selected', {
                    entries: selectedRowKeys.length
                  })}
                  {selectedStatus && (
                    <span className="ml-2">
                      {`(${t('selection.status')}: `}
                      <Tag
                        color={
                          getStatusColor(selectedStatus) as
                            | 'default'
                            | 'blue'
                            | 'green'
                            | 'red'
                            | 'purple'
                            | 'orange'
                            | 'gray'
                        }
                      >
                        {t(`status.${selectedStatus}` as 'status.submitted')}
                      </Tag>
                      {')'}
                    </span>
                  )}
                  {!allSelectedSameStatus && (
                    <span className="ml-2 text-orange-600">{`(${t('selection.mixed_statuses')})`}</span>
                  )}
                </span>
              </div>
            )}
            <div className="flex min-w-[320px] shrink-0 flex-wrap items-center justify-end gap-2">
              {allSelectedSubmitted && noneArchived && (
                <Button
                  variant="primary"
                  onClick={() => handleApprove()}
                  disabled={selectedRowKeys.length === 0}
                >
                  {t('bulk_actions.approve_selected')}
                </Button>
              )}
              {allSelectedSubmitted && noneArchived && (
                <Button
                  variant="secondary"
                  onClick={() => handleDeny()}
                  disabled={selectedRowKeys.length === 0}
                  actionStatus={denyStatus}
                >
                  {t('bulk_actions.deny_selected')}
                </Button>
              )}
              {allSelectedApproved && noneArchived && (
                <Button
                  variant="secondary"
                  onClick={() => handlePay()}
                  disabled={selectedRowKeys.length === 0}
                >
                  {t('bulk_actions.mark_as_paid')}
                </Button>
              )}
              {(allSelectedApproved || allSelectedDenied || allSelectedPaid) &&
                noneArchived && (
                  <Button
                    variant="secondary"
                    onClick={() => handleReset()}
                    disabled={selectedRowKeys.length === 0}
                    actionStatus={resetStatus}
                  >
                    {t('bulk_actions.reset_selected')}
                  </Button>
                )}
              {(allSelectedDenied || allSelectedPaid) && noneArchived && (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => handleArchive()}
                  disabled={selectedRowKeys.length === 0}
                  actionStatus={archiveStatus}
                >
                  {t('bulk_actions.archive_selected')}
                </Button>
              )}
              {allSelectedPaid && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleMultiZipDownload}
                  disabled={selectedRowKeys.length === 0}
                >
                  {t('bulk_actions.download_zip')}
                </Button>
              )}
              {toBeDeleted > 0 && (
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => setDeleteOldArchivedModalVisible(true)}
                >
                  {t('bulk_actions.remove_old_archived')}
                </Button>
              )}
              {selectedRowKeys.length > 0 && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleCopyClipboardText}
                >
                  {t('bulk_actions.copy_clipboard_text')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div
          className="overflow-x-auto rounded bg-white p-2 shadow"
          style={{ minWidth: '900px' }}
        >
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="border-b border-gray-200 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase"
                      style={{
                        width: header.column.getSize() ?? undefined
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    {t('table_pagination.no_data_available')}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const isExpanded = !!expandedIds[row.original.id]
                  return (
                    <Fragment key={row.id}>
                      <tr
                        className="hover:bg-gray-50"
                        data-row-key={row.original.id}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="border-b border-gray-100 px-4 py-3 text-sm text-gray-900"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="bg-gray-50/50 p-4"
                          >
                            <AdminEntryExpandedRow
                              record={row.original}
                              onApprove={handleApprove}
                              onDeny={handleDeny}
                              onPay={handlePay}
                              onReset={handleReset}
                              onArchive={handleArchive}
                              denyStatus={denyStatus}
                              archiveStatus={archiveStatus}
                              resetStatus={resetStatus}
                              setEditState={setEditState}
                              setPreviewState={setPreviewState}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>

          {totalRows > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm text-gray-700">
                {start + 1}
                {'-'}
                {Math.min(start + pagination.pageSize, totalRows)}
                {' / '}
                {totalRows}
              </div>
              <div className="flex items-center gap-2">
                <Select.Root
                  value={String(table.getState().pagination.pageSize)}
                  onValueChange={(v) => {
                    if (v != null) {
                      table.setPageSize(Number(v))
                      table.setPageIndex(0)
                    }
                  }}
                  items={PAGE_SIZES.map((size) => ({
                    value: String(size),
                    label: `${size} ${t('table_pagination.per_page')}`
                  }))}
                >
                  <Select.Trigger
                    className="flex h-8 min-w-20 cursor-pointer items-center justify-between gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2 focus-visible:outline-none"
                    aria-label={t('table_pagination.per_page')}
                  >
                    <Select.Value
                      className="min-w-0"
                      placeholder={t('table_pagination.per_page')}
                    />
                    <Select.Icon className="shrink-0">
                      <ChevronDown className="h-3.5 w-3" aria-hidden />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal
                    container={
                      typeof document !== 'undefined' ? document.body : null
                    }
                  >
                    <Select.Positioner
                      sideOffset={4}
                      positionMethod="fixed"
                      className="z-110"
                    >
                      <Select.Popup className="z-110 max-h-[300px] overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
                        <Select.List>
                          {PAGE_SIZES.map((size) => (
                            <Select.Item
                              key={size}
                              value={String(size)}
                              className="w-full cursor-pointer px-3 py-2 text-left text-xs data-highlighted:bg-gray-100 data-selected:bg-blue-50 data-selected:text-blue-600"
                            >
                              <Select.ItemText>
                                {size} {t('table_pagination.per_page')}
                              </Select.ItemText>
                            </Select.Item>
                          ))}
                        </Select.List>
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
                <Button
                  variant="secondary"
                  size="small"
                  type="button"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  {t('table_pagination.previous')}
                </Button>
                <span className="text-sm text-gray-700">
                  {t('table_pagination.page')} {safePage + 1}{' '}
                  {t('table_pagination.of')} {pageCount}
                </span>
                <Button
                  variant="secondary"
                  size="small"
                  type="button"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  {t('table_pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
