export function getRandomArrayItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, delay: number) => {
  let timer: ReturnType<typeof setTimeout> | null = null

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

export const isNumber = (value: unknown): value is number => {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}
