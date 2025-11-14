import { ref } from 'vue'
import type { User, UserId } from '@/types/users.types.ts'
import { defineStore } from 'pinia'
import UsersService from '@/services/users.service.ts'
import { useRequestLoading } from '@/composables/useRequestLoading.ts'
import { usePagination } from '@/composables/usePagination.ts'

type DefaultListOptions = {
  endpoint: string
  initPageSize?: number
}

export const useUsersStore = (
  options: DefaultListOptions = { endpoint: '/api/users', initPageSize: 10 },
) => {
  const usersService = new UsersService(options.endpoint)

  return defineStore('users', () => {
    const users = ref<User[]>([])

    const { isLoading, isRequestLoading } = useRequestLoading()
    const {
      currentPage,
      pageSize,

      totalPages,
      paginationStart,
      paginationEnd,
      visiblePages,

      goToPage,
      handlePageSizeChange,
    } = usePagination(users, options?.initPageSize)

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

    return {
      users,

      getUsers,
      addNewUser,
      deleteUser,
      deleteUsersMultiple,

      isLoading,
      isRequestLoading,

      currentPage,
      pageSize,

      totalPages,
      paginationStart,
      paginationEnd,
      visiblePages,

      goToPage,
      handlePageSizeChange,
    }
  })()
}
