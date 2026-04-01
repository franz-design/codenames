export function readAdminTokenFromLocalStorage(): string | null {
  if (typeof window === 'undefined')
    return null
  return localStorage.getItem('adminToken')
}

export function isAdminSpectatorClientConfigured(): boolean {
  const envToken = import.meta.env.VITE_ADMIN_TOKEN
  if (typeof envToken !== 'string' || envToken.length === 0)
    return false
  const local = readAdminTokenFromLocalStorage()
  return local != null && local === envToken
}
