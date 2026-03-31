const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const apiUrl = (path: string) => {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (API_BASE_URL) {
    return `${API_BASE_URL}${normalized}`
  }
  return `/api${normalized}`
}
