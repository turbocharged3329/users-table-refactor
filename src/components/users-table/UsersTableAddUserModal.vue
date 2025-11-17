<template>
  <UModal v-model="visibleModel">
    <template #header>
      <h3>Добавить нового пользователя</h3>
      <button @click="visibleModel = false" class="btn-close">✕</button>
    </template>

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

    <template #footer>
      <button @click="visibleModel = false" class="btn btn-secondary">Отмена</button>
      <button
        @click="addNewUserHandler"
        class="btn btn-primary"
        :disabled="!isNewUserValid || isSaving"
      >
        {{ isSaving ? 'Сохранение...' : 'Добавить' }}
      </button>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { validateEmail } from '@/utils/validate'
import { useUsersStore } from '@/stores/users.store'
import { storeToRefs } from 'pinia'
import { generateId } from '@/utils'
import type { User, NewUser } from '@/types/users.types'
import UModal from '@/components/UModal.vue'

const DEFAULT_NEW_USER: NewUser = {
  name: '',
  email: '',
  role: 'user',
  sendWelcomeEmail: true,
}

const visibleModel = defineModel({ type: Boolean, default: false })

const usersStore = useUsersStore()
const { addNewUser } = usersStore
const { users } = storeToRefs(usersStore)

const isSaving = ref(false)

const newUser = ref<NewUser>({ ...DEFAULT_NEW_USER })

const newUserErrors = ref<Record<string, string>>({
  name: '',
  email: '',
})

const isNewUserValid = computed(() => {
  return (
    newUser.value.name.trim().length > 0 &&
    newUser.value.email.trim().length > 0 &&
    validateEmail(newUser.value.email) &&
    !newUserErrors.value.name &&
    !newUserErrors.value.email
  )
})

function validateNewUserName() {
  if (newUser.value.name.trim().length === 0) {
    newUserErrors.value.name = 'Имя обязательно для заполнения'
  } else if (newUser.value.name.trim().length < 3) {
    newUserErrors.value.name = 'Имя должно содержать минимум 3 символа'
  } else {
    newUserErrors.value.name = ''
  }
}

function validateNewUserEmail() {
  if (newUser.value.email.trim().length === 0) {
    newUserErrors.value.email = 'Email обязателен для заполнения'
  } else if (!validateEmail(newUser.value.email)) {
    newUserErrors.value.email = 'Некорректный формат email'
  } else if (users.value.some((u) => u.email === newUser.value.email)) {
    newUserErrors.value.email = 'Пользователь с таким email уже существует'
  } else {
    newUserErrors.value.email = ''
  }
}

async function addNewUserHandler() {
  validateNewUserEmail()
  validateNewUserName()

  if (!isNewUserValid.value) {
    return
  }

  isSaving.value = true

  try {
    const newUserData: User = {
      id: generateId(),
      name: newUser.value.name,
      email: newUser.value.email,
      role: newUser.value.role,
      status: 'active',
      registrationDate: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      avatar: null,
      loginCount: 0,
      postsCount: 0,
      commentsCount: 0,
    }

    await addNewUser(newUserData)

    visibleModel.value = false
  } catch (err) {
    alert('Ошибка создания пользователя: ' + (err instanceof Error ? err.message : String(err)))
  } finally {
    isSaving.value = false
  }
}

watch(visibleModel, (value) => {
  if (!value) {
    newUser.value = { ...DEFAULT_NEW_USER }
  }
})
</script>
