import { ref } from 'vue'

export const useSort = (defaultSortValue = 'id') => {
  const sortValue = ref<string>(defaultSortValue)
  const sortDirection = ref<'asc' | 'desc'>('asc')

  const sortBy = (value: string) => {
    if (sortValue.value === value) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortValue.value = value
      sortDirection.value = 'asc'
    }
  }

  return {
    sortValue,
    sortDirection,

    sortBy,
  }
}
