import type { User, UserId, UserRole, UserStatus } from '@/types/users.types'
import { generateId, getRandomArrayItem } from '@/utils'

export default class UsersService {
  // добавлен проброс эндпоинта, но не использован в метродах из за мок-данных
  private readonly endpoint: string
  constructor(private readonly endpoint: string) {}

  private _generateMockUsers(count: number): User[] {
    const roles: UserRole[] = ['admin', 'user', 'moderator']
    const statuses: UserStatus[] = ['active', 'inactive']
    const names = [
      'Иван Петров',
      'Мария Сидорова',
      'Алексей Иванов',
      'Елена Кузнецова',
      'Дмитрий Смирнов',
      'Ольга Попова',
      'Сергей Васильев',
      'Анна Соколова',
      'Николай Михайлов',
      'Татьяна Новикова',
    ]

    const users: User[] = []

    for (let i = 1; i <= count; i++) {
      const name = getRandomArrayItem(names) + ' ' + i
      const registrationDate = new Date(
        2020,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28),
      )
      const lastActivity = new Date(
        Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      )

      users.push({
        id: generateId(),
        name: name,
        email: `user${i}@example.com`,
        role: getRandomArrayItem(roles),
        status: getRandomArrayItem(statuses),
        registrationDate: registrationDate.toISOString(),
        lastActivity: lastActivity.toISOString(),
        avatar: null,
        loginCount: Math.floor(Math.random() * 500),
        postsCount: Math.floor(Math.random() * 100),
        commentsCount: Math.floor(Math.random() * 300),
      })
    }

    return users
  }

  async getUsers(): Promise<User[]> {
    // Симуляция API запроса
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Генерация тестовых данных
    return this._generateMockUsers(100)
  }

  async addNewUser(userData: User): Promise<User> {
    // Симуляция API запроса
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newUser: User = {
      id: generateId(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      status: 'active',
      registrationDate: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      avatar: null,
      loginCount: 0,
      postsCount: 0,
      commentsCount: 0,
    }

    return newUser
  }

  async deleteUser(userId: UserId): Promise<UserId> {
    // Симуляция API запроса
    await new Promise((resolve) => setTimeout(resolve, 300))

    return userId
  }

  async deleteUsersMultiple(userIds: UserId[]): Promise<UserId[]> {
    // Симуляция API запроса
    await new Promise((resolve) => setTimeout(resolve, 500))

    return userIds
  }

  async updateUser(userId: UserId, userData: User): Promise<User> {
    // Симуляция API запроса
    await new Promise((resolve) => setTimeout(resolve, 500))

    return userData
  }
}
