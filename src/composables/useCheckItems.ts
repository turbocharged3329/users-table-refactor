import { ref, computed } from 'vue'
import type { Ref } from 'vue'
export const useCheckItems = <T, K extends keyof T>(itemsArray: Ref<T[]>, checkedIdKey: K) => {
  type CheckedId = T[K]
  const checkedItems = ref<CheckedId[]>([])

  const isAllSelected = computed(() => {
    if (itemsArray.value.length === 0) {
      return false
    }

    return itemsArray.value.every((item) => {
      const itemId = item[checkedIdKey]

      return checkedItems.value.some((id) => id === itemId)
    })
  })

  const toggleSelectItem = (itemId: CheckedId) => {
    const index = checkedItems.value.findIndex((id) => id === itemId)
    if (index > -1) {
      checkedItems.value.splice(index, 1)
    } else {
      checkedItems.value.push(itemId as (typeof checkedItems.value)[number])
    }
  }

  const toggleSelectAll = () => {
    if (isAllSelected.value) {
      checkedItems.value = []

      return
    }

    itemsArray.value.forEach((item) => {
      const itemId = item[checkedIdKey]
      if (!checkedItems.value.some((id) => id === itemId)) {
        checkedItems.value.push(itemId as (typeof checkedItems.value)[number])
      }
    })
  }

  return {
    checkedItems,
    isAllSelected,

    toggleSelectItem,
    toggleSelectAll,
  }
}
