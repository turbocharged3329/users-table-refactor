export type UTableColumnSortValue = string | undefined

export interface UTableColumn {
  title: string
  sortValue: UTableColumnSortValue
  sortable?: boolean
}

export type SortDirection = 'asc' | 'desc' | ''
