export const validateEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const getErrorTextMessage = (err: Error | unknown) => {
  return err instanceof Error ? err.message : String(err)
}
