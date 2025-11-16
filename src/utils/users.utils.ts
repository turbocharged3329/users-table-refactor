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
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
  const initial = name.charAt(0).toUpperCase()
  const colorIndex = name.charCodeAt(0) % colors.length
  const color = colors[colorIndex]

  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='${encodeURIComponent(color)}'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='20' fill='white'%3E${initial}%3C/text%3E%3C/svg%3E`
}
