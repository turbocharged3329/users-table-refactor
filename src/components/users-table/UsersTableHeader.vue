<template>
  <div class="table-header">
    <div class="header-left">
      <h2>{{ title }}</h2>
      <span class="total-count">{{ filteredAndSearchedUsers.length }} записей</span>
    </div>

    <div class="header-right">
      <input
        type="text"
        placeholder="Поиск по имени, email..."
        class="search-input"
        :value="filters.searchQuery"
        @input="handleSearch"
      />

      <select
        :value="filters.filterRole"
        @change="setListFilters({ filterRole: ($event.target as HTMLSelectElement).value })"
        class="role-filter"
      >
        <template v-for="role in ROLES_OPTIONS" :key="role.value">
          <option :value="role.value">{{ role.title }}</option>
        </template>
      </select>

      <button @click="$emit('show-add-user-modal')" class="btn btn-primary" :disabled="isLoading">
        + Добавить пользователя
      </button>

      <button
        @click="exportToCSV"
        class="btn btn-secondary"
        :disabled="isLoading || checkedItems.length === 0"
      >
        📥 Экспорт
      </button>

      <button
        v-if="checkedItems.length > 0"
        @click="deleteSelectedUsersHandler"
        class="btn btn-danger"
      >
        🗑️ Удалить выбранные ({{ checkedItems.length }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUsersStore } from '@/stores/users.store'
import { storeToRefs } from 'pinia'
import { debounce } from '@/utils'
import { createAndDownloadCSV } from '@/utils/file.ts'
import type { UserId, UserRole } from '@/types/users.types'
import { getRoleLabel } from '@/utils/users.utils'
import { formatDate } from '@/utils/date.ts'
import { getErrorTextMessage } from '@/utils/validate.ts'

const ROLES_OPTIONS = [
  {
    value: '',
    title: 'Все роли',
  },
  {
    value: 'admin',
    title: 'Администротор',
  },
  {
    value: 'user',
    title: 'Пользователь',
  },
  {
    value: 'moderator',
    title: 'Модератор',
  },
] as { value: UserRole | ''; title: string }[]

interface Props {
  title: string
  checkedItems: UserId[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'show-add-user-modal'): void
  (e: 'success-delete-users'): void
}>()

const usersStore = useUsersStore()
const { setListFilters } = usersStore
const { filters, filteredAndSearchedUsers, isLoading, users, sortedUsers } = storeToRefs(usersStore)

// Поиск
const handleSearch = (event: Event) => {
  debounce(() => setListFilters({ searchQuery: (event.target as HTMLInputElement).value }), 500)()
}

// Экспорт
const exportToCSV = () => {
  const usersToExport =
    props.checkedItems.length > 0
      ? users.value.filter((u) => props.checkedItems.includes(u.id))
      : sortedUsers.value

  const headers = ['ID', 'Имя', 'Email', 'Роль', 'Статус', 'Дата регистрации']
  const rows = usersToExport.map((user) => [
    user.id,
    user.name,
    user.email,
    getRoleLabel(user.role),
    user.status === 'active' ? 'Активен' : 'Неактивен',
    formatDate(user.registrationDate),
  ])

  createAndDownloadCSV(headers, rows, `users_export_${new Date().getTime()}`)
}

const deleteSelectedUsersHandler = async () => {
  if (!confirm(`Вы уверены, что хотите удалить ${props.checkedItems.length} пользователей?`)) {
    return
  }

  try {
    const deletedUserIds = await usersStore.deleteUsersMultiple(props.checkedItems)

    if (deletedUserIds.length) {
      emit('success-delete-users')
    }
  } catch (err) {
    alert('Ошибка удаления: ' + getErrorTextMessage(err))
  }
}
</script>

<style scoped>
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-left h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.total-count {
  color: #666;
  font-size: 14px;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 250px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #4caf50;
}

.role-filter {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
</style>
