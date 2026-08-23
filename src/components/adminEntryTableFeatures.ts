import {
  columnFilteringFeature,
  columnSizingFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_datetime,
  tableFeatures
} from '@tanstack/react-table'

export const adminEntryTableFeatures = tableFeatures({
  columnFilteringFeature,
  columnSizingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  sortFns: { datetime: sortFn_datetime }
})

export type AdminEntryTableFeatures = typeof adminEntryTableFeatures
