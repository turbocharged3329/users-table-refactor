<template>
  <div class="user-table-container">
    <UsersTableHeader
      :title="title"
      :checkedItems="checkedItems"
      @show-add-user-modal="showAddUserModal = true"
      @success-delete-users="checkedItems = []"
    />

    <UsersTableFilters />

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
        <UTableHead
          :columns="$options.TABLE_COLUMNS"
          :isAllSelected="isAllSelected"
          :sortValue="sortValue"
          :sortDirection="sortDirection"
          @check-all="toggleSelectAll"
          @sort="sortHandler"
        />

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

    <UPagination
      v-if="!isLoading"
      :pageSize="pageSize"
      :currentPage="currentPage"
      :totalPages="totalPages"
      :visiblePages="visiblePages"
      @go-to="goToPage"
      @change-page-size="handlePageSizeChange"
    >
      <template #results>
        <span
          >Показано {{ paginationStart }} - {{ paginationEnd }} из
          {{ filteredAndSearchedUsers.length }}</span
        >
      </template>
    </UPagination>

    <UsersTableAddUserModal v-model="showAddUserModal" />
    <UsersTableUserDetailsModal v-model="showDetailsModal" :selectedUser="selectedUser" />
  </div>
</template>

<script lang="ts">
import { ref } from 'vue'
import { getRoleLabel, formatRelativeTime } from '@/utils/users.utils'
import { formatDate } from '@/utils/date.ts'
import { getErrorTextMessage } from '@/utils/validate.ts'
import { useUsersStore } from '@/stores/users.store'
import { storeToRefs } from 'pinia'
import type { User, UserId } from '@/types/users.types'
import { getDefaultAvatar, getActivityClass } from '@/utils/users.utils'
import { useCheckItems } from '@/composables/useCheckItems'
import UsersTableAddUserModal from '@/components/users-table/UsersTableAddUserModal.vue'
import UsersTableUserDetailsModal from '@/components/users-table/UsersTableUserDetailsModal.vue'
import UsersTableHeader from '@/components/users-table/UsersTableHeader.vue'
import UsersTableFilters from '@/components/users-table/UsersTableFilters.vue'
import UPagination from '@/components/UPagination.vue'
import UTableHead from '@/components/UTableHead.vue'
import type { UTableColumn, UTableColumnSortValue } from '@/types/ui.types'

export default {
  name: 'UserTable',

  TABLE_COLUMNS: [
    {
      title: 'ID',
      sortValue: 'id',
      sortable: true,
    },
    {
      title: 'Имя',
      sortValue: 'name',
      sortable: true,
    },
    {
      title: 'Email',
      sortValue: 'email',
      sortable: true,
    },
    {
      title: 'Роль',
    },
    {
      title: 'Статус',
    },
    {
      title: 'Дата регистрации',
      sortValue: 'registrationDate',
      sortable: true,
    },
    {
      title: 'Последняя активность',
    },
    {
      title: 'Действия',
    },
  ] as UTableColumn[],

  components: {
    UsersTableAddUserModal,
    UsersTableUserDetailsModal,
    UsersTableHeader,
    UsersTableFilters,
    UPagination,
    UTableHead,
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

      sortValue,
      sortDirection,
      filteredAndSearchedUsers,
      paginatedUsers,
      sortedUsers,
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

      sortBy,
    } = usersStore

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

    sortHandler(sortValue: UTableColumnSortValue) {
      if (!sortValue) {
        return
      }

      this.sortBy(sortValue as keyof User)
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
  },
}
</script>

<style scoped>
.user-table-container {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
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
</style>
