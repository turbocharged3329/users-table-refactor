import { ref } from 'vue'

export const useSort = <T extends object>() => {
  const sortValue = ref<keyof T | null>(null)
  const sortDirection = ref<'asc' | 'desc'>('asc')

  const sortBy = (value: keyof T) => {
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
