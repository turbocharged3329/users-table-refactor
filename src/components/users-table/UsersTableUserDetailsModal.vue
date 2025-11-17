<template>
  <UModal v-model="visibleModel" variant="large">
    <template #header>
      <h3>Информация о пользователе</h3>
      <button @click="visibleModel = false" class="btn-close">✕</button>
    </template>

    <div class="user-details" v-if="selectedUser">
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

    <template #footer>
      <button @click="visibleModel = false" class="btn btn-secondary">Закрыть</button>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { getRoleLabel, getDefaultAvatar } from '@/utils/users.utils'
import { formatDate } from '@/utils/date.ts'
import type { User } from '@/types/users.types'
import { formatRelativeTime } from '@/utils/users.utils'
import UModal from '@/components/UModal.vue'

const visibleModel = defineModel({ type: Boolean, default: false })

interface Props {
  selectedUser: User | null
}

defineProps<Props>()
</script>

<style scoped>
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

.user-email {
  color: #666;
  text-align: center;
  margin: 5px 0 0 0;
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
