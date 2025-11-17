<template>
  <tr
    :class="{
      selected: checked,
      editing: isEditing,
      inactive: userData.status === 'inactive',
    }"
  >
    <td>
      <input type="checkbox" :checked @change="$emit('check-item', userData.id)" />
    </td>
    <td>{{ userData.id }}</td>
    <td>
      <div v-if="isEditing">
        <input v-model="editForm.name" type="text" class="edit-input" />
      </div>
      <div v-else class="user-name-cell">
        <img
          :src="userData.avatar || getDefaultAvatar(userData.name)"
          :alt="userData.name"
          class="avatar"
        />
        <span>{{ userData.name }}</span>
      </div>
    </td>
    <td>
      <div v-if="isEditing">
        <input v-model="editForm.email" type="email" class="edit-input" />
      </div>
      <div v-else>{{ userData.email }}</div>
    </td>
    <td>
      <div v-if="isEditing">
        <select v-model="editForm.role" class="edit-select">
          <template v-for="role in USERS_ROLES_OPTIONS" :key="role.value">
            <option :value="role.value">{{ role.title }}</option>
          </template>
        </select>
      </div>
      <div v-else>
        <span :class="['role-badge', 'role-' + userData.role]">
          {{ getRoleLabel(userData.role) }}
        </span>
      </div>
    </td>
    <td>
      <span
        :class="[
          'status-badge',
          userData.status === 'active' ? 'status-active' : 'status-inactive',
        ]"
        @click="$emit('toggle-status', userData.id)"
        :style="{ cursor: 'pointer' }"
      >
        {{ userData.status === 'active' ? '✓ Активен' : '✗ Неактивен' }}
      </span>
    </td>
    <td>{{ formatDate(userData.registrationDate) }}</td>
    <td>
      <span :class="getActivityClass(userData.lastActivity)">
        {{ formatRelativeTime(userData.lastActivity) }}
      </span>
    </td>
    <td>
      <div class="action-buttons">
        <button v-if="!isEditing" @click="startEdit" class="btn-icon" title="Редактировать">
          ✏️
        </button>
        <button v-if="isEditing" @click="saveEdit" class="btn-icon btn-success" title="Сохранить">
          ✓
        </button>
        <button v-if="isEditing" @click="cancelEdit" class="btn-icon btn-cancel" title="Отмена">
          ✗
        </button>
        <button v-if="!isEditing" @click="$emit('details')" class="btn-icon" title="Подробнее">
          👁️
        </button>
        <button
          v-if="!isEditing"
          @click="$emit('delete')"
          class="btn-icon btn-danger"
          title="Удалить"
        >
          🗑️
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import type { User, UserId, UserRole } from '@/types/users.types'
import { getDefaultAvatar, getRoleLabel, getActivityClass } from '@/utils/users.utils'
import { formatDate } from '@/utils/date.ts'
import { formatRelativeTime } from '@/utils/users.utils'
import { getErrorTextMessage } from '@/utils/validate.ts'
import { useUsersStore } from '@/stores/users.store'
import { USERS_ROLES_OPTIONS } from '@/constants/users.constants'

const DEFAULT_EDIT_FORM: Pick<User, 'name' | 'email'> & { role: UserRole } = {
  name: '',
  email: '',
  role: 'user',
}

interface Props {
  userData: User
  editingUserId: UserId | null
  checked: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'check-item', id: UserId): void
  (e: 'toggle-status', id: UserId): void
  (e: 'edit'): void
  (e: 'save-edit', payload: User): void
  (e: 'cancel'): void
  (e: 'details'): void
  (e: 'delete'): void
}>()

const usersStore = useUsersStore()
const { updateUser } = usersStore

const editForm = ref({
  ...DEFAULT_EDIT_FORM,
})

const isEditing = computed(() => props.editingUserId === props.userData.id)

function startEdit() {
  emit('edit')
  editForm.value = {
    name: props.userData.name,
    email: props.userData.email,
    role: props.userData.role,
  }
}

function resetForm() {
  editForm.value = {
    ...DEFAULT_EDIT_FORM,
  }
}

async function saveEdit() {
  const payload: User = {
    ...props.userData,
    ...editForm.value,
  }

  try {
    await updateUser(props.userData.id, payload)
    resetForm()
  } catch (err) {
    alert('Ошибка сохранения: ' + getErrorTextMessage(err))
  }
}

function cancelEdit() {
  emit('cancel')
  resetForm()
}

onUnmounted(() => {
  emit('cancel')
  resetForm()
})
</script>

<style scoped>
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

td {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
}

tr {
  transition: background 0.2s;
}

tr:hover {
  background: #fafafa;
}

tr.selected {
  background: #e8f5e9;
}

tr.editing {
  background: #fff9c4;
}

tr.inactive {
  opacity: 0.6;
}
</style>
