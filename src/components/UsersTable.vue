<template>
  <div class="user-table-container">
    <!-- Хедер с действиями -->
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
          @input="handleSearch"
        />

        <select
          :value="filters.filterRole"
          @change="setListFilters({ filterRole: ($event.target as HTMLSelectElement).value })"
          class="role-filter"
        >
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="user">Пользователь</option>
          <option value="moderator">Модератор</option>
        </select>

        <button @click="showAddUserModal = true" class="btn btn-primary" :disabled="isLoading">
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

    <!-- Фильтры -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Статус:</label>
        <button
          :class="['filter-btn', { active: filters.filterStatus === '' }]"
          @click="clearFilters(['filterStatus'])"
        >
          Все
        </button>
        <button
          :class="['filter-btn', { active: filters.filterStatus === 'active' }]"
          @click="setListFilters({ filterStatus: 'active' })"
        >
          Активные
        </button>
        <button
          :class="['filter-btn', { active: filters.filterStatus === 'inactive' }]"
          @click="setListFilters({ filterStatus: 'inactive' })"
        >
          Неактивные
        </button>
      </div>

      <div class="filter-group">
        <label>Дата регистрации:</label>
        <input
          :value="filters.dateFrom"
          @blur="setListFilters({ dateFrom: ($event.target as HTMLInputElement).value })"
          type="date"
          class="date-input"
        />
        <span>-</span>
        <input
          :value="filters.dateTo"
          @blur="setListFilters({ dateTo: ($event.target as HTMLInputElement).value })"
          type="date"
          class="date-input"
        />
        <button @click="clearFilters(['dateFrom', 'dateTo'])" class="btn-clear">Очистить</button>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Загрузка данных...</p>
    </div>

    <!-- Ошибка -->
    <div v-if="error" class="error-message">
      <span>❌ {{ error }}</span>
      <button @click="retryLoad" class="btn-retry">Повторить</button>
    </div>

    <!-- Таблица -->
    <div v-if="!isLoading && !error" class="table-wrapper">
      <table class="user-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll" />
            </th>
            <th @click="sortBy('id')" :class="{ sortable: true, active: sortValue === 'id' }">
              ID
              <span v-if="sortValue === 'id'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('name')" :class="{ sortable: true, active: sortValue === 'name' }">
              Имя
              <span v-if="sortValue === 'name'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th @click="sortBy('email')" :class="{ sortable: true, active: sortValue === 'email' }">
              Email
              <span v-if="sortValue === 'email'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Роль</th>
            <th>Статус</th>
            <th
              @click="sortBy('registrationDate')"
              :class="{ sortable: true, active: sortValue === 'registrationDate' }"
            >
              Дата регистрации
              <span v-if="sortValue === 'registrationDate'">
                {{ sortDirection === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th>Последняя активность</th>
            <th>Действия</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="user in paginatedUsers"
            :key="user.id"
            :class="{
              selected: checkedItems.some((checkedId) => checkedId === user.id),
              editing: editingUserId === user.id,
              inactive: user.status === 'inactive',
            }"
          >
            <td>
              <input
                type="checkbox"
                :checked="checkedItems.some((checkedId) => checkedId === user.id)"
                @change="toggleSelectItem(user.id)"
              />
            </td>
            <td>{{ user.id }}</td>
            <td>
              <div v-if="editingUserId === user.id">
                <input v-model="editForm.name" type="text" class="edit-input" />
              </div>
              <div v-else class="user-name-cell">
                <img
                  :src="user.avatar || getDefaultAvatar(user.name)"
                  :alt="user.name"
                  class="avatar"
                />
                <span>{{ user.name }}</span>
              </div>
            </td>
            <td>
              <div v-if="editingUserId === user.id">
                <input v-model="editForm.email" type="email" class="edit-input" />
              </div>
              <div v-else>{{ user.email }}</div>
            </td>
            <td>
              <div v-if="editingUserId === user.id">
                <select v-model="editForm.role" class="edit-select">
                  <option value="admin">Администратор</option>
                  <option value="user">Пользователь</option>
                  <option value="moderator">Модератор</option>
                </select>
              </div>
              <div v-else>
                <span :class="['role-badge', 'role-' + user.role]">
                  {{ getRoleLabel(user.role) }}
                </span>
              </div>
            </td>
            <td>
              <span
                :class="[
                  'status-badge',
                  user.status === 'active' ? 'status-active' : 'status-inactive',
                ]"
                @click="toggleUserStatus(user.id)"
                :style="{ cursor: 'pointer' }"
              >
                {{ user.status === 'active' ? '✓ Активен' : '✗ Неактивен' }}
              </span>
            </td>
            <td>{{ formatDate(user.registrationDate) }}</td>
            <td>
              <span :class="getActivityClass(user.lastActivity)">
                {{ formatRelativeTime(user.lastActivity) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button
                  v-if="editingUserId !== user.id"
                  @click="startEdit(user)"
                  class="btn-icon"
                  title="Редактировать"
                >
                  ✏️
                </button>
                <button
                  v-if="editingUserId === user.id"
                  @click="saveEdit(user.id)"
                  class="btn-icon btn-success"
                  title="Сохранить"
                >
                  ✓
                </button>
                <button
                  v-if="editingUserId === user.id"
                  @click="cancelEdit"
                  class="btn-icon btn-cancel"
                  title="Отмена"
                >
                  ✗
                </button>
                <button
                  v-if="editingUserId !== user.id"
                  @click="openUserDetails(user)"
                  class="btn-icon"
                  title="Подробнее"
                >
                  👁️
                </button>
                <button
                  v-if="editingUserId !== user.id"
                  @click="deleteUserHandler(user.id)"
                  class="btn-icon btn-danger"
                  title="Удалить"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Сообщение если нет данных -->
      <div v-if="paginatedUsers.length === 0" class="no-data">
        <p>😔 Нет данных для отображения</p>
        <button @click="clearFilters(null)" class="btn btn-primary">Сбросить фильтры</button>
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="!isLoading" class="pagination">
      <div class="pagination-info">
        Показано {{ paginationStart }} - {{ paginationEnd }} из
        {{ filteredAndSearchedUsers.length }}
      </div>

      <div class="pagination-controls">
        <button @click="goToPage(1)" :disabled="currentPage === 1" class="btn-page">⏮️</button>
        <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="btn-page">
          ◀️
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          @click="goToPage(page)"
          :class="['btn-page', { active: currentPage === page }]"
        >
          {{ page }}
        </button>

        <button
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="btn-page"
        >
          ▶️
        </button>
        <button
          @click="goToPage(totalPages)"
          :disabled="currentPage === totalPages"
          class="btn-page"
        >
          ⏭️
        </button>
      </div>

      <div class="page-size-selector">
        <label>На странице:</label>
        <select :value="pageSize" @change="handlePageSizeChange($event.target.value)">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <UsersTableAddUserModal v-model="showAddUserModal" />
    <UsersTableUserDetailsModal v-model="showDetailsModal" :selectedUser="selectedUser" />
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import { getRoleLabel, formatRelativeTime } from '@/utils/users.utils'
import { formatDate } from '@/utils/date.ts'
import { getErrorTextMessage } from '@/utils/validate.ts'
import { createAndDownloadCSV } from '@/utils/file.ts'
import { useUsersStore } from '@/stores/users.store'
import { storeToRefs } from 'pinia'
import type { User, UserId } from '@/types/users.types'
import { debounce } from '@/utils'
import { getDefaultAvatar, getActivityClass } from '@/utils/users.utils'
import { useCheckItems } from '@/composables/useCheckItems'
import UsersTableAddUserModal from '@/components/users-table/UsersTableAddUserModal.vue'
import UsersTableUserDetailsModal from '@/components/users-table/UsersTableUserDetailsModal.vue'

export default {
  name: 'UserTable',

  components: {
    UsersTableAddUserModal,
    UsersTableUserDetailsModal,
  },

  props: {
    title: {
      type: String,
      default: 'Управление пользователями',
    },
    initialPageSize: {
      type: Number,
      default: 25,
    },
    apiEndpoint: {
      type: String,
      default: '/api/users',
    },
  },

  setup(props) {
    const usersStore = useUsersStore({
      endpoint: props.apiEndpoint,
      initPageSize: props.initialPageSize,
      initialFilters: {
        searchQuery: '',
        filterRole: '',
        filterStatus: '',
        dateFrom: '',
        dateTo: '',
      },
    })

    const {
      users,
      isLoading,

      currentPage,
      pageSize,
      totalPages,
      paginationStart,
      paginationEnd,
      visiblePages,

      filters,
    } = storeToRefs(usersStore)

    const {
      getUsers,
      addNewUser,
      deleteUser,
      deleteUsersMultiple,
      goToPage,
      handlePageSizeChange,

      setListFilters,
      clearFilters,
    } = usersStore

    const { sortValue, sortDirection, filteredAndSearchedUsers, paginatedUsers, sortedUsers } =
      storeToRefs(usersStore)
    const { sortBy } = usersStore
    const { checkedItems, isAllSelected, toggleSelectItem, toggleSelectAll } = useCheckItems(
      paginatedUsers,
      'id',
    )

    const error = ref<string | null>(null)

    return {
      error,

      // Сортировка
      sortValue,
      sortDirection,
      sortBy,

      // Пагинация
      currentPage,
      pageSize,
      totalPages,
      paginationStart,
      paginationEnd,
      visiblePages,
      goToPage,
      handlePageSizeChange,

      // Пользователи
      users,

      sortedUsers,
      paginatedUsers,
      filteredAndSearchedUsers,

      getUsers,
      addNewUser,
      deleteUser,
      deleteUsersMultiple,

      // Фильтры
      filters,
      setListFilters,
      clearFilters,

      // Выбор строк
      checkedItems,
      isAllSelected,
      toggleSelectItem,
      toggleSelectAll,

      // Состояние запроса
      isLoading,
    }
  },

  data() {
    return {
      // Состояния загрузки
      isSaving: false,

      // Редактирование
      editingUserId: null,
      editForm: {
        name: '',
        email: '',
        role: '',
      },

      // Модальные окна
      showAddUserModal: false,
      showDetailsModal: false,
      selectedUser: null as User | null,
    }
  },

  mounted() {
    this.loadUsers()
  },

  methods: {
    formatDate,
    getDefaultAvatar,
    getActivityClass,
    getRoleLabel,
    formatRelativeTime,

    // Загрузка данных
    async loadUsers() {
      this.error = null

      try {
        await this.getUsers()
      } catch (err) {
        this.error = 'Ошибка загрузки данных: ' + getErrorTextMessage(err)
        console.error(err)
      }
    },

    async retryLoad() {
      await this.loadUsers()
    },

    // Поиск
    handleSearch($event) {
      debounce(() => this.setListFilters({ searchQuery: $event.target.value }), 500)()
    },

    // Редактирование
    startEdit(user) {
      this.editingUserId = user.id
      this.editForm = {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    },

    cancelEdit() {
      this.editingUserId = null
      this.editForm = {
        name: '',
        email: '',
        role: '',
      }
    },

    async saveEdit(userId: UserId) {
      this.isSaving = true

      try {
        // Симуляция API запроса
        await new Promise((resolve) => setTimeout(resolve, 500))

        const userIndex = this.users.findIndex((u) => u.id === userId)
        if (userIndex !== -1) {
          this.users[userIndex] = {
            ...this.users[userIndex],
            ...this.editForm,
          }
        }

        this.editingUserId = null
        this.editForm = {
          name: '',
          email: '',
          role: '',
        }
      } catch (err) {
        alert('Ошибка сохранения: ' + getErrorTextMessage(err))
      } finally {
        this.isSaving = false
      }
    },

    // Удаление
    deleteUserHandler(userId: UserId) {
      if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
        return
      }

      try {
        this.deleteUser(userId)
      } catch (err) {
        alert('Ошибка удаления: ' + getErrorTextMessage(err))
      }
    },

    async deleteSelectedUsersHandler() {
      if (!confirm(`Вы уверены, что хотите удалить ${this.checkedItems.length} пользователей?`)) {
        return
      }

      try {
        const deletedUserIds = await this.deleteUsersMultiple(this.checkedItems)

        if (deletedUserIds.length) {
          this.checkedItems = []
        }
      } catch (err) {
        alert('Ошибка удаления: ' + getErrorTextMessage(err))
      }
    },

    // Переключение статуса
    async toggleUserStatus(userId) {
      try {
        const user = this.users.find((u) => u.id === userId)
        if (user) {
          user.status = user.status === 'active' ? 'inactive' : 'active'
        }
      } catch (err) {
        alert('Ошибка изменения статуса: ' + err.message)
      }
    },

    // Модальное окно деталей
    openUserDetails(user: User) {
      this.selectedUser = user
      this.showDetailsModal = true
    },

    closeDetailsModal() {
      this.showDetailsModal = false
      this.selectedUser = null
    },

    // Экспорт
    exportToCSV() {
      const usersToExport =
        this.checkedItems.length > 0
          ? this.users.filter((u) => this.checkedItems.includes(u.id))
          : this.sortedUsers

      const headers = ['ID', 'Имя', 'Email', 'Роль', 'Статус', 'Дата регистрации']
      const rows = usersToExport.map((user) => [
        user.id,
        user.name,
        user.email,
        this.getRoleLabel(user.role),
        user.status === 'active' ? 'Активен' : 'Неактивен',
        this.formatDate(user.registrationDate),
      ])

      createAndDownloadCSV(headers, rows, `users_export_${new Date().getTime()}`)
    },
  },
}
</script>

<style scoped>
.user-table-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

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

.filters-section {
  background: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group label {
  font-weight: 500;
  color: #555;
  min-width: 150px;
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: #f0f0f0;
}

.filter-btn.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.date-input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-clear {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-clear:hover {
  background: #f0f0f0;
}

.loading-overlay {
  background: white;
  padding: 60px 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.btn-retry {
  padding: 8px 16px;
  background: #c62828;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.table-wrapper {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table thead {
  background: #f5f5f5;
  border-bottom: 2px solid #ddd;
}

.user-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  font-size: 14px;
}

.user-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.user-table th.sortable:hover {
  background: #eeeeee;
}

.user-table th.active {
  color: #4caf50;
}

.user-table td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

.user-table tbody tr {
  transition: background 0.2s;
}

.user-table tbody tr:hover {
  background: #fafafa;
}

.user-table tbody tr.selected {
  background: #e8f5e9;
}

.user-table tbody tr.editing {
  background: #fff9c4;
}

.user-table tbody tr.inactive {
  opacity: 0.6;
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.btn-icon {
  padding: 6px 10px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

.btn-icon.btn-success {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.btn-icon.btn-cancel {
  background: #ff9800;
  color: white;
  border-color: #ff9800;
}

.btn-icon.btn-danger {
  border-color: #f44336;
}

.btn-icon.btn-danger:hover {
  background: #f44336;
  color: white;
}

.edit-input,
.edit-select {
  padding: 6px 10px;
  border: 1px solid #4caf50;
  border-radius: 4px;
  width: 100%;
  font-size: 14px;
}

.no-data {
  padding: 60px 20px;
  text-align: center;
  color: #999;
}

.no-data p {
  font-size: 18px;
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  gap: 5px;
}

.btn-page {
  padding: 6px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  min-width: 36px;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #f0f0f0;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-page.active {
  background: #4caf50;
  color: white;
  border-color: #4caf50;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-size-selector label {
  color: #666;
  font-size: 14px;
}

.page-size-selector select {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
</style>
