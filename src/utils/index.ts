export function getRandomArrayItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
