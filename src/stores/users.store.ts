import { ref, computed } from 'vue'
import type { User, UserId } from '@/types/users.types.ts'
import type { ListFilters } from '@/types/index.types.ts'
import { defineStore } from 'pinia'
import UsersService from '@/services/users.service.ts'
import { useRequestLoading } from '@/composables/useRequestLoading.ts'
import { useSort } from '@/composables/useSort'
import { usePagination } from '@/composables/usePagination.ts'
import { useFilters } from '@/composables/useFilters'

type DefaultListOptions = {
  endpoint: string
  initPageSize: number
  initialFilters: ListFilters
}

export const useUsersStore = (
  options: DefaultListOptions = { endpoint: '/api/users', initPageSize: 10, initialFilters: {} },
) => {
  const usersService = new UsersService(options.endpoint)

  return defineStore('users', () => {
    const users = ref<User[]>([])

    const { isLoading, isRequestLoading } = useRequestLoading()
    const { sortValue, sortDirection, sortBy } = useSort<User>()
    const { filters, setFilters, clearFilters } = useFilters(options.initialFilters)
    const {
      currentPage,
      pageSize,

      totalPages,
      paginationStart,
      paginationEnd,
      visiblePages,

      goToPage,
      handlePageSizeChange,
    } = usePagination(users, options.initPageSize)

    // Фильтрация по роли
    const roleFilteredUsers = computed(() => {
      if (!filters.value.filterRole) {
        return users.value
      }
      return users.value.filter((user) => user.role === filters.value.filterRole)
    })

    // Фильтрация по статусу
    const statusFilteredUsers = computed(() => {
      if (!filters.value.filterStatus) {
        return roleFilteredUsers.value
      }
      return roleFilteredUsers.value.filter((user) => user.status === filters.value.filterStatus)
    })

    // Фильтрация по датам
    const dateFilteredUsers = computed(() => {
      let filtered = [...statusFilteredUsers.value]

      if (filters.value.dateFrom) {
        const fromDate = new Date(filters.value.dateFrom)
        filtered = filtered.filter((user) => {
          const userDate = new Date(user.registrationDate)
          return userDate >= fromDate
        })
      }

      if (filters.value.dateTo) {
        const toDate = new Date(filters.value.dateTo)
        toDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter((user) => {
          const userDate = new Date(user.registrationDate)
          return userDate <= toDate
        })
      }

      return filtered
    })

    const filteredAndSearchedUsers = computed(() => {
      if (!filters.value.searchQuery?.trim()) {
        return dateFilteredUsers.value
      }

      const query = filters.value.searchQuery.toLowerCase().trim()
      return dateFilteredUsers.value.filter((user) => {
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.id.toString().includes(query)
        )
      })
    })

    const sortedUsers = computed(() => {
      const users = [...filteredAndSearchedUsers.value]
      const sortKey = sortValue.value

      if (!sortKey) {
        return users
      }

      users.sort((a, b) => {
        let aVal = a[sortKey]!
        let bVal = b[sortKey]!

        if (sortKey === 'registrationDate' || sortKey === 'lastActivity') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) {
          return sortDirection.value === 'asc' ? -1 : 1
        }
        if (aVal > bVal) {
          return sortDirection.value === 'asc' ? 1 : -1
        }
        return 0
      })

      return users
    })

    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return sortedUsers.value.slice(start, end)
    })

    const getUsers = async () => {
      try {
        isLoading.value = true
        users.value = await usersService.getUsers()
      } catch (e) {
        throw e
      } finally {
        isLoading.value = false
      }
    }

    const addNewUser = async (userData: User) => {
      try {
        isLoading.value = true

        const newUser: User = await usersService.addNewUser(userData)

        if (newUser) {
          users.value.unshift(newUser)
        }
      } catch (e) {
        throw e
      } finally {
        isLoading.value = false
      }
    }

    const deleteUser = async (userId: UserId) => {
      try {
        isLoading.value = true

        const deletedUserId = await usersService.deleteUser(userId)

        if (deletedUserId) {
          const index = users.value.findIndex((u) => u.id === deletedUserId)
          if (index !== -1) {
            users.value.splice(index, 1)
          }
        }
      } catch (e) {
        throw e
      } finally {
        isLoading.value = false
      }
    }

    const deleteUsersMultiple = async (userIds: UserId[]) => {
      try {
        isLoading.value = true

        const deletedUserIds = await usersService.deleteUsersMultiple(userIds)

        if (deletedUserIds.length) {
          users.value = users.value.filter((user) => !deletedUserIds.includes(user.id))
        }

        return deletedUserIds
      } catch (e) {
        throw e
      } finally {
        isLoading.value = false
      }
    }

    const setListFilters = (filtersObj: ListFilters) => {
      setFilters(filtersObj)
      goToPage(1)
    }

    return {
      users,

      roleFilteredUsers,
      statusFilteredUsers,
      dateFilteredUsers,
      filteredAndSearchedUsers,
      sortedUsers,
      paginatedUsers,

      getUsers,
      addNewUser,
      deleteUser,
      deleteUsersMultiple,

      isLoading,
      isRequestLoading,

      sortValue,
      sortDirection,
      sortBy,

      currentPage,
      pageSize,
      totalPages,
      paginationStart,
      paginationEnd,
      visiblePages,
      goToPage,
      handlePageSizeChange,

      filters,
      clearFilters,
      setListFilters,
    }
  })()
}
