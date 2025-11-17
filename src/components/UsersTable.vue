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
          <UsersTableRow
            v-for="user in paginatedUsers"
            :key="user.id"
            :userData="user"
            :editingUserId
            :checked="checkedItems.some((checkedId) => checkedId === user.id)"
            @check-item="toggleSelectItem"
            @toggle-status="toggleUserStatus"
            @edit="editingUserId = user.id"
            @save-edit="editingUserId = null"
            @cancel="editingUserId = null"
            @details="openUserDetails(user)"
            @delete="deleteUserHandler(user.id)"
          />
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
import UsersTableRow from '@/components/users-table/UsersTableRow.vue'
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
    UsersTableRow,
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

    const editingUserId = ref<UserId | null>(null)

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

      // Редактирование
      editingUserId,
    }
  },

  data() {
    return {
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
    async toggleUserStatus(userId: UserId) {
      try {
        const user = this.users.find((u) => u.id === userId)
        if (user) {
          user.status = user.status === 'active' ? 'inactive' : 'active'
        }
      } catch (err) {
        alert('Ошибка изменения статуса: ' + getErrorTextMessage(err))
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
