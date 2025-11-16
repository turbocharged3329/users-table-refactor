import type { ListFilters } from '@/types/index.types'
import { ref } from 'vue'

export const useFilters = <T extends Partial<ListFilters>>(initialFilters: T) => {
  const filters = ref<T>({
    ...initialFilters,
  })

  const setFilters = (filtersObj: T) => {
    filters.value = {
      ...filters.value,
      ...filtersObj,
    }
  }

  const clearFilters = (filtersKeys: (keyof T)[] | null | undefined) => {
    if (!filtersKeys || !filtersKeys?.length) {
      Object.keys(filters.value).forEach((key) => {
        filters.value[key] = ''
      })

      return
    }

    filtersKeys.forEach((key) => {
      filters.value[key] = ''
    })
  }

  return {
    filters,

    setFilters,
    clearFilters,
  }
}
