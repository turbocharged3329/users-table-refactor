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
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по имени, email..."
          class="search-input"
          @input="handleSearch"
        />

        <select v-model="filterRole" class="role-filter">
          <option value="">Все роли</option>
          <option value="admin">Администратор</option>
          <option value="user">Пользователь</option>
          <option value="moderator">Модератор</option>
        </select>

        <button @click="openAddUserModal" class="btn btn-primary" :disabled="isLoading">
          + Добавить пользователя
        </button>

        <button
          @click="exportToCSV"
          class="btn btn-secondary"
          :disabled="isLoading || (selectedUsers.length === 0 && !showAllUsers)"
        >
          📥 Экспорт
        </button>

        <button
          v-if="selectedUsers.length > 0"
          @click="deleteSelectedUsersHandler"
          class="btn btn-danger"
        >
          🗑️ Удалить выбранные ({{ selectedUsers.length }})
        </button>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="filters-section">
      <div class="filter-group">
        <label>Статус:</label>
        <button :class="['filter-btn', { active: filterStatus === '' }]" @click="filterStatus = ''">
          Все
        </button>
        <button
          :class="['filter-btn', { active: filterStatus === 'active' }]"
          @click="filterStatus = 'active'"
        >
          Активные
        </button>
        <button
          :class="['filter-btn', { active: filterStatus === 'inactive' }]"
          @click="filterStatus = 'inactive'"
        >
          Неактивные
        </button>
      </div>

      <div class="filter-group">
        <label>Дата регистрации:</label>
        <input v-model="dateFrom" type="date" class="date-input" />
        <span>-</span>
        <input v-model="dateTo" type="date" class="date-input" />
        <button @click="clearDateFilter" class="btn-clear">Очистить</button>
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
              selected: selectedUsers.includes(user.id),
              editing: editingUserId === user.id,
              inactive: user.status === 'inactive',
            }"
          >
            <td>
              <input
                type="checkbox"
                :checked="selectedUsers.includes(user.id)"
                @change="toggleSelectUser(user.id)"
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
        <button @click="clearAllFilters" class="btn btn-primary">Сбросить фильтры</button>
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
        <select v-model="pageSize" @change="handlePageSizeChange">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <!-- Модальное окно добавления пользователя -->
    <div v-if="showAddUserModal" class="modal-overlay" @click.self="closeAddUserModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Добавить нового пользователя</h3>
          <button @click="closeAddUserModal" class="btn-close">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Имя*</label>
            <input
              v-model="newUser.name"
              type="text"
              :class="{ error: newUserErrors.name }"
              @input="validateNewUserName"
            />
            <span v-if="newUserErrors.name" class="error-text">
              {{ newUserErrors.name }}
            </span>
          </div>

          <div class="form-group">
            <label>Email*</label>
            <input
              v-model="newUser.email"
              type="email"
              :class="{ error: newUserErrors.email }"
              @input="validateNewUserEmail"
            />
            <span v-if="newUserErrors.email" class="error-text">
              {{ newUserErrors.email }}
            </span>
          </div>

          <div class="form-group">
            <label>Роль*</label>
            <select v-model="newUser.role">
              <option value="user">Пользователь</option>
              <option value="moderator">Модератор</option>
              <option value="admin">Администратор</option>
            </select>
          </div>

          <div class="form-group">
            <label>
              <input v-model="newUser.sendWelcomeEmail" type="checkbox" />
              Отправить приветственное письмо
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeAddUserModal" class="btn btn-secondary">Отмена</button>
          <button
            @click="addNewUserHandler"
            class="btn btn-primary"
            :disabled="!isNewUserValid || isSaving"
          >
            {{ isSaving ? 'Сохранение...' : 'Добавить' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно деталей пользователя -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3>Информация о пользователе</h3>
          <button @click="closeDetailsModal" class="btn-close">✕</button>
        </div>

        <div class="modal-body" v-if="selectedUser">
          <div class="user-details">
            <div class="detail-section">
              <img
                :src="selectedUser.avatar || getDefaultAvatar(selectedUser.name)"
                :alt="selectedUser.name"
                class="avatar-large"
              />
              <h2>{{ selectedUser.name }}</h2>
              <p class="user-email">{{ selectedUser.email }}</p>
            </div>

            <div class="detail-section">
              <h4>Основная информация</h4>
              <div class="detail-row">
                <span class="label">ID:</span>
                <span>{{ selectedUser.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Роль:</span>
                <span :class="['role-badge', 'role-' + selectedUser.role]">
                  {{ getRoleLabel(selectedUser.role) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Статус:</span>
                <span
                  :class="[
                    'status-badge',
                    selectedUser.status === 'active' ? 'status-active' : 'status-inactive',
                  ]"
                >
                  {{ selectedUser.status === 'active' ? 'Активен' : 'Неактивен' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="label">Дата регистрации:</span>
                <span>{{ formatDate(selectedUser.registrationDate) }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Последняя активность:</span>
                <span>{{ formatRelativeTime(selectedUser.lastActivity) }}</span>
              </div>
            </div>

            <div class="detail-section">
              <h4>Статистика</h4>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">{{ selectedUser.loginCount || 0 }}</div>
                  <div class="stat-label">Входов</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ selectedUser.postsCount || 0 }}</div>
                  <div class="stat-label">Постов</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">{{ selectedUser.commentsCount || 0 }}</div>
                  <div class="stat-label">Комментариев</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeDetailsModal" class="btn btn-secondary">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import { formatDate } from '@/utils/date.ts'
import { validateEmail, getErrorTextMessage } from '@/utils/validate.ts'
import { createAndDownloadCSV } from '@/utils/file.ts'
import { useSort } from '@/composables/useSort.ts'
import { useUsersStore } from '@/stores/users.store'
import { storeToRefs } from 'pinia'
import type { User, UserId } from '@/types/users.types'
import { generateId } from '@/utils'

export default {
  name: 'UserTable',

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

  setup() {
    const { sortValue, sortDirection, sortBy } = useSort()
    const usersStore = useUsersStore()
    const { users, isLoading } = storeToRefs(usersStore)
    const { getUsers, addNewUser, deleteUser, deleteUsersMultiple } = usersStore

    const error = ref<string | null>(null)

    return {
      error,

      // Сортировка
      sortValue,
      sortDirection,
      sortBy,

      // Пользователи
      users,
      getUsers,
      addNewUser,
      deleteUser,
      deleteUsersMultiple,
      isLoading,
    }
  },

  data() {
    return {
      // Состояния загрузки
      isSaving: false,

      // Поиск и фильтрация
      searchQuery: '',
      filterRole: '',
      filterStatus: '',
      dateFrom: '',
      dateTo: '',

      // Пагинация
      currentPage: 1,
      pageSize: this.initialPageSize,

      // Выбор строк
      selectedUsers: [],
      showAllUsers: false,

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
      selectedUser: null,

      // Новый пользователь
      newUser: {
        name: '',
        email: '',
        role: 'user',
        sendWelcomeEmail: true,
      },
      newUserErrors: {
        name: '',
        email: '',
      },
    }
  },

  computed: {
    // Фильтрация по роли
    roleFilteredUsers() {
      if (!this.filterRole) {
        return this.users
      }
      return this.users.filter((user) => user.role === this.filterRole)
    },

    // Фильтрация по статусу
    statusFilteredUsers() {
      if (!this.filterStatus) {
        return this.roleFilteredUsers
      }
      return this.roleFilteredUsers.filter((user) => user.status === this.filterStatus)
    },

    // Фильтрация по датам
    dateFilteredUsers() {
      let filtered = this.statusFilteredUsers

      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom)
        filtered = filtered.filter((user) => {
          const userDate = new Date(user.registrationDate)
          return userDate >= fromDate
        })
      }

      if (this.dateTo) {
        const toDate = new Date(this.dateTo)
        toDate.setHours(23, 59, 59, 999)
        filtered = filtered.filter((user) => {
          const userDate = new Date(user.registrationDate)
          return userDate <= toDate
        })
      }

      return filtered
    },

    // Поиск
    filteredAndSearchedUsers() {
      if (!this.searchQuery.trim()) {
        return this.dateFilteredUsers
      }

      const query = this.searchQuery.toLowerCase().trim()
      return this.dateFilteredUsers.filter((user) => {
        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.id.toString().includes(query)
        )
      })
    },

    // Сортировка
    sortedUsers() {
      const users = [...this.filteredAndSearchedUsers]

      users.sort((a, b) => {
        let aVal = a[this.sortValue]
        let bVal = b[this.sortValue]

        if (this.sortValue === 'registrationDate' || this.sortValue === 'lastActivity') {
          aVal = new Date(aVal).getTime()
          bVal = new Date(bVal).getTime()
        } else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }

        if (aVal < bVal) {
          return this.sortDirection === 'asc' ? -1 : 1
        }
        if (aVal > bVal) {
          return this.sortDirection === 'asc' ? 1 : -1
        }
        return 0
      })

      return users
    },

    // Пагинация
    totalPages() {
      return Math.ceil(this.sortedUsers.length / this.pageSize)
    },

    paginationStart() {
      return (this.currentPage - 1) * this.pageSize + 1
    },

    paginationEnd() {
      const end = this.currentPage * this.pageSize
      return end > this.sortedUsers.length ? this.sortedUsers.length : end
    },

    paginatedUsers() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.sortedUsers.slice(start, end)
    },

    visiblePages() {
      const pages = []
      const total = this.totalPages
      const current = this.currentPage

      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          pages.push(i)
        }
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        } else if (current >= total - 3) {
          pages.push(1)
          pages.push('...')
          for (let i = total - 4; i <= total; i++) {
            pages.push(i)
          }
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = current - 1; i <= current + 1; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(total)
        }
      }

      return pages
    },

    // Выбор всех
    isAllSelected() {
      return (
        this.paginatedUsers.length > 0 &&
        this.paginatedUsers.every((user) => this.selectedUsers.includes(user.id))
      )
    },

    // Валидация нового пользователя
    isNewUserValid() {
      return (
        this.newUser.name.trim().length > 0 &&
        this.newUser.email.trim().length > 0 &&
        validateEmail(this.newUser.email) &&
        !this.newUserErrors.name &&
        !this.newUserErrors.email
      )
    },
  },

  watch: {
    searchQuery() {
      this.currentPage = 1
    },

    filterRole() {
      this.currentPage = 1
    },

    filterStatus() {
      this.currentPage = 1
    },

    dateFrom() {
      this.currentPage = 1
    },

    dateTo() {
      this.currentPage = 1
    },

    pageSize() {
      this.currentPage = 1
    },
  },

  mounted() {
    this.loadUsers()
  },

  methods: {
    formatDate,

    // Загрузка данных
    async loadUsers() {
      this.error = null

      try {
        // Симуляция API запроса
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
    handleSearch() {
      // Дебаунс можно добавить здесь
    },

    // Пагинация
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },

    handlePageSizeChange() {
      this.currentPage = 1
    },

    // Выбор строк
    toggleSelectUser(userId) {
      const index = this.selectedUsers.indexOf(userId)
      if (index > -1) {
        this.selectedUsers.splice(index, 1)
      } else {
        this.selectedUsers.push(userId)
      }
    },

    toggleSelectAll() {
      if (this.isAllSelected) {
        this.paginatedUsers.forEach((user) => {
          const index = this.selectedUsers.indexOf(user.id)
          if (index > -1) {
            this.selectedUsers.splice(index, 1)
          }
        })
      } else {
        this.paginatedUsers.forEach((user) => {
          if (!this.selectedUsers.includes(user.id)) {
            this.selectedUsers.push(user.id)
          }
        })
      }
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
      if (!confirm(`Вы уверены, что хотите удалить ${this.selectedUsers.length} пользователей?`)) {
        return
      }

      try {
        const deletedUserIds = await this.deleteUsersMultiple(this.selectedUsers)

        if (deletedUserIds.length) {
          this.selectedUsers = []
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

    // Модальное окно добавления
    openAddUserModal() {
      this.showAddUserModal = true
      this.newUser = {
        name: '',
        email: '',
        role: 'user',
        sendWelcomeEmail: true,
      }
      this.newUserErrors = {
        name: '',
        email: '',
      }
    },

    closeAddUserModal() {
      this.showAddUserModal = false
    },

    validateNewUserName() {
      if (this.newUser.name.trim().length === 0) {
        this.newUserErrors.name = 'Имя обязательно для заполнения'
      } else if (this.newUser.name.trim().length < 3) {
        this.newUserErrors.name = 'Имя должно содержать минимум 3 символа'
      } else {
        this.newUserErrors.name = ''
      }
    },

    validateNewUserEmail() {
      if (this.newUser.email.trim().length === 0) {
        this.newUserErrors.email = 'Email обязателен для заполнения'
      } else if (!validateEmail(this.newUser.email)) {
        this.newUserErrors.email = 'Некорректный формат email'
      } else if (this.users.some((u) => u.email === this.newUser.email)) {
        this.newUserErrors.email = 'Пользователь с таким email уже существует'
      } else {
        this.newUserErrors.email = ''
      }
    },

    async addNewUserHandler() {
      this.validateNewUserName()
      this.validateNewUserEmail()

      if (!this.isNewUserValid) {
        return
      }

      this.isSaving = true

      try {
        const newUser: User = {
          id: generateId(),
          name: this.newUser.name,
          email: this.newUser.email,
          role: this.newUser.role,
          status: 'active',
          registrationDate: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          avatar: null,
          loginCount: 0,
          postsCount: 0,
          commentsCount: 0,
        }

        await this.addNewUser(newUser)

        this.closeAddUserModal()
      } catch (err) {
        alert('Ошибка создания пользователя: ' + (err instanceof Error ? err.message : String(err)))
      } finally {
        this.isSaving = false
      }
    },

    // Модальное окно деталей
    openUserDetails(user) {
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
        this.selectedUsers.length > 0
          ? this.users.filter((u) => this.selectedUsers.includes(u.id))
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

    // Очистка фильтров
    clearDateFilter() {
      this.dateFrom = ''
      this.dateTo = ''
    },

    clearAllFilters() {
      this.searchQuery = ''
      this.filterRole = ''
      this.filterStatus = ''
      this.dateFrom = ''
      this.dateTo = ''
    },

    // Утилиты
    getRoleLabel(role) {
      const labels = {
        admin: 'Администратор',
        user: 'Пользователь',
        moderator: 'Модератор',
      }
      return labels[role] || role
    },

    formatRelativeTime(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'только что'
      if (diffMins < 60) return `${diffMins} мин. назад`
      if (diffHours < 24) return `${diffHours} ч. назад`
      if (diffDays < 30) return `${diffDays} дн. назад`
      return this.formatDate(dateString)
    },

    getActivityClass(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor((now - date) / 86400000)

      if (diffDays < 1) return 'activity-recent'
      if (diffDays < 7) return 'activity-week'
      if (diffDays < 30) return 'activity-month'
      return 'activity-old'
    },

    getDefaultAvatar(name) {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
      const initial = name.charAt(0).toUpperCase()
      const colorIndex = name.charCodeAt(0) % colors.length
      const color = colors[colorIndex]

      return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`
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

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-secondary {
  background: #2196f3;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #0b7dda;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #da190b;
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

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.role-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-admin {
  background: #ffebee;
  color: #c62828;
}

.role-user {
  background: #e3f2fd;
  color: #1565c0;
}

.role-moderator {
  background: #fff3e0;
  color: #e65100;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-inactive {
  background: #ffebee;
  color: #c62828;
}

.activity-recent {
  color: #2e7d32;
  font-weight: 500;
}

.activity-week {
  color: #1565c0;
}

.activity-month {
  color: #e65100;
}

.activity-old {
  color: #757575;
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal.modal-large {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.btn-close:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

.form-group input[type='text'],
.form-group input[type='email'],
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input.error {
  border-color: #f44336;
}

.error-text {
  color: #f44336;
  font-size: 12px;
  margin-top: 5px;
  display: block;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-section {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 6px;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.avatar-large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 15px;
  display: block;
}

.user-email {
  color: #666;
  text-align: center;
  margin: 5px 0 0 0;
}

.detail-section h2 {
  text-align: center;
  margin: 0 0 5px 0;
  font-size: 22px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row .label {
  font-weight: 500;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.stat-card {
  background: white;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #4caf50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}
</style>
