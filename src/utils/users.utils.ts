import type { UserRole } from '@/types/users.types'
import { formatDate } from '@/utils/date.ts'

export const getActivityClass = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()

  if (isNaN(date.getTime()) || isNaN(now.getTime())) {
    return 'activity-old'
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000)

  if (diffDays < 1) return 'activity-recent'
  if (diffDays < 7) return 'activity-week'
  if (diffDays < 30) return 'activity-month'

  return 'activity-old'
}

export const getDefaultAvatar = (name: string) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'] as const
  const initial = name.charAt(0).toUpperCase()
  const colorIndex = name.charCodeAt(0) % colors.length
  const color = colors[colorIndex] ?? colors[0]

  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`
}

export const getRoleLabel = (role: UserRole) => {
  const labels = {
    admin: 'Администратор',
    user: 'Пользователь',
    moderator: 'Модератор',
  }
  return labels[role] || role
}

export const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'только что'
  if (diffMins < 60) return `${diffMins} мин. назад`
  if (diffHours < 24) return `${diffHours} ч. назад`
  if (diffDays < 30) return `${diffDays} дн. назад`

  return formatDate(dateString)
}
