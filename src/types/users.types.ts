export type UserRole = 'admin' | 'user' | 'moderator'
export type UserStatus = 'active' | 'inactive'
export type UserId = string

export interface User {
  id: UserId
  name: string
  email: string
  role: UserRole
  status: UserStatus
  registrationDate: string // ISO string
  lastActivity: string // ISO string
  avatar: string | null
  loginCount: number
  postsCount: number
  commentsCount: number
}

export interface NewUser {
  name: string
  email: string
  role: UserRole
  sendWelcomeEmail: boolean
}
