import { ADMIN_EMAIL_HEADER } from '@/lib/adminApiHeaders'

/** Admin API: oturum çerezi + isteğe bağlı legacy Bearer (AGENT_TOKEN / ADMIN_TOKEN). */
export function adminFetchInit(
  init: RequestInit = {},
  opts?: { bearerToken?: string | null; adminEmail?: string | null }
): RequestInit {
  const headers = new Headers(init.headers)
  const bearer = opts?.bearerToken?.trim()
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`)
  const em = opts?.adminEmail?.trim()
  if (em) headers.set(ADMIN_EMAIL_HEADER, em)
  return {
    ...init,
    credentials: 'include',
    headers,
  }
}
