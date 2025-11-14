import { computed, ref } from 'vue'

export const useRequestLoading = () => {
  const isLoading = ref(false)
  const isRequestLoading = computed(() => isLoading.value)

  return {
    isLoading,
    isRequestLoading,
  }
}
