import type { UserRole } from '@/types/users.types'

export const USERS_ROLES_OPTIONS: { value: UserRole; title: string }[] = [
  {
    value: 'admin',
    title: 'Администратор',
  },
  {
    value: 'user',
    title: 'Пользователь',
  },
  {
    value: 'moderator',
    title: 'Модератор',
  },
]
